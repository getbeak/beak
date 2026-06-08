import { AGENT_PAIR_PATH, AGENT_PAIR_TOKEN_PATH, pairTokenResponseSchema } from '@beak/common/wire/agent';

import { newPkcePair, newState } from './crypto';

// Pending pairings are keyed by the CSRF `state` token so the return tab
// (a separate browser tab opened by `window.open`) can find the matching
// PKCE verifier in `localStorage`. `sessionStorage` doesn't work here —
// it's per-tab, and the agent's return URL lands in a fresh tab with an
// empty sessionStorage. `localStorage` is shared across same-origin tabs,
// and the `state` lookup means a concurrent second pairing can't collide.
const STORAGE_KEY_PREFIX = 'beak.agent.pairing.pending.';
const MAX_AGE_MS = 5 * 60 * 1000;

interface PendingPairing {
	state: string;
	codeVerifier: string;
	baseUrl: string;
	startedAt: number;
}

function storageKeyFor(state: string): string {
	return `${STORAGE_KEY_PREFIX}${state}`;
}

function sweepExpired(): void {
	if (typeof window === 'undefined') return;
	const now = Date.now();
	const toDelete: string[] = [];
	for (let i = 0; i < window.localStorage.length; i++) {
		const key = window.localStorage.key(i);
		if (!key?.startsWith(STORAGE_KEY_PREFIX)) continue;
		const raw = window.localStorage.getItem(key);
		if (!raw) {
			toDelete.push(key);
			continue;
		}
		try {
			const value = JSON.parse(raw) as Partial<PendingPairing>;
			if (typeof value?.startedAt !== 'number' || now - value.startedAt > MAX_AGE_MS) {
				toDelete.push(key);
			}
		} catch {
			toDelete.push(key);
		}
	}
	for (const k of toDelete) window.localStorage.removeItem(k);
}

/**
 * Open the pair tab and stash the PKCE verifier so /pair/return can
 * complete the handshake after the user clicks Allow. The pending entry
 * is keyed by the `state` token in `localStorage`, so the new tab opened
 * by `window.open` can read the same entry (sessionStorage is per-tab
 * and would be empty in the new tab).
 */
export async function startPairing(baseUrl: string, returnUrl: string): Promise<void> {
	sweepExpired();
	const state = newState();
	const { codeVerifier, codeChallengePromise } = newPkcePair();
	const codeChallenge = await codeChallengePromise;

	const pending: PendingPairing = { state, codeVerifier, baseUrl, startedAt: Date.now() };
	window.localStorage.setItem(storageKeyFor(state), JSON.stringify(pending));

	const pairUrl = new URL(`${baseUrl}${AGENT_PAIR_PATH}`);
	pairUrl.searchParams.set('origin', window.location.origin);
	pairUrl.searchParams.set('state', state);
	pairUrl.searchParams.set('code_challenge', codeChallenge);
	pairUrl.searchParams.set('code_challenge_method', 'S256');
	pairUrl.searchParams.set('return', returnUrl);

	window.open(pairUrl.toString(), '_blank', 'noopener');
}

export interface PairingReturnQuery {
	state: string | null;
	code: string | null;
	error: string | null;
}

export function readPairingReturnQuery(search: string = window.location.search): PairingReturnQuery {
	const params = new URLSearchParams(search);
	return {
		state: params.get('state'),
		code: params.get('code'),
		error: params.get('error'),
	};
}

export interface CompletedPairing {
	tokenId: string;
	token: string;
	baseUrl: string;
}

/**
 * Finish the pair flow: read the pending PKCE state keyed by the `state`
 * token from localStorage, exchange the code for a token, return the
 * token + tokenId. Throws on state mismatch, expired/missing pending
 * pairing, or agent failure.
 */
export async function completePairing(query: PairingReturnQuery): Promise<CompletedPairing> {
	if (query.error) throw new Error(`pairing_${query.error}`);
	if (!query.code || !query.state) throw new Error('pairing_missing_code_or_state');

	sweepExpired();
	const raw = window.localStorage.getItem(storageKeyFor(query.state));
	if (!raw) throw new Error('pairing_no_pending');
	let pending: PendingPairing;
	try {
		pending = JSON.parse(raw);
	} catch {
		throw new Error('pairing_corrupt_pending');
	}
	if (pending.state !== query.state) throw new Error('pairing_state_mismatch');

	const response = await fetch(`${pending.baseUrl}${AGENT_PAIR_TOKEN_PATH}`, {
		method: 'POST',
		mode: 'cors',
		credentials: 'omit',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ code: query.code, code_verifier: pending.codeVerifier }),
	});
	if (!response.ok) {
		const detail = await response.text().catch(() => '');
		throw new Error(`pairing_token_exchange_failed_${response.status}_${detail.slice(0, 80)}`);
	}
	const json = (await response.json()) as unknown;
	const parsed = pairTokenResponseSchema.safeParse(json);
	if (!parsed.success) throw new Error('pairing_invalid_token_response');

	window.localStorage.removeItem(storageKeyFor(query.state));
	return { token: parsed.data.token, tokenId: parsed.data.tokenId, baseUrl: pending.baseUrl };
}

export function clearPending(): void {
	// No specific state to clear — sweep everything stale and call it done.
	sweepExpired();
}
