import { AGENT_PAIR_PATH, AGENT_PAIR_TOKEN_PATH, pairTokenResponseSchema } from '@beak/common/wire/agent';

import { newPkcePair, newState } from './crypto';

const SESSION_STORAGE_KEY = 'beak.agent.pairing.pending';

interface PendingPairing {
	state: string;
	codeVerifier: string;
	baseUrl: string;
	startedAt: number;
}

/**
 * Open the pair tab and stash the PKCE verifier so /pair/return can
 * complete the handshake after the user clicks Allow. `sessionStorage`
 * scopes the pending pairing to this browser tab — opening Beak in two
 * tabs at once produces two independent pairings, which is correct.
 */
export async function startPairing(baseUrl: string, returnUrl: string): Promise<void> {
	const state = newState();
	const { codeVerifier, codeChallengePromise } = newPkcePair();
	const codeChallenge = await codeChallengePromise;

	const pending: PendingPairing = { state, codeVerifier, baseUrl, startedAt: Date.now() };
	window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(pending));

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
 * Finish the pair flow: read the pending PKCE state from sessionStorage,
 * exchange the code for a token, return the token + tokenId. Throws on
 * state mismatch, expired/missing pending pairing, or agent failure.
 */
export async function completePairing(query: PairingReturnQuery): Promise<CompletedPairing> {
	if (query.error) throw new Error(`pairing_${query.error}`);
	if (!query.code || !query.state) throw new Error('pairing_missing_code_or_state');

	const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
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

	clearPending();
	return { token: parsed.data.token, tokenId: parsed.data.tokenId, baseUrl: pending.baseUrl };
}

export function clearPending(): void {
	window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
