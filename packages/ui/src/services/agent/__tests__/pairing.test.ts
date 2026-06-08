import { AGENT_PAIR_PATH, AGENT_PAIR_TOKEN_PATH } from '@beak/common/wire/agent';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearPending, completePairing, readPairingReturnQuery, startPairing } from '../pairing';

/**
 * PKCE pairing flow tests. The flow uses `localStorage` keyed by the
 * PKCE `state` token — `sessionStorage` is per-tab and the agent
 * redirects the new tab to `/agent/pair/return` where it would find
 * an empty store. Per-state keys also let concurrent pairings from
 * the same origin coexist.
 */

const STORAGE_KEY_PREFIX = 'beak.agent.pairing.pending.';

interface PendingPairing {
	state: string;
	codeVerifier: string;
	baseUrl: string;
	startedAt: number;
}

function createMemoryStorage(): Storage {
	const map = new Map<string, string>();
	return {
		get length() {
			return map.size;
		},
		clear() {
			map.clear();
		},
		getItem(key: string) {
			return map.has(key) ? (map.get(key) as string) : null;
		},
		setItem(key: string, value: string) {
			map.set(key, String(value));
		},
		removeItem(key: string) {
			map.delete(key);
		},
		key(index: number) {
			return Array.from(map.keys())[index] ?? null;
		},
	};
}

function installFakeLocalStorage(): Storage {
	const storage = createMemoryStorage();
	Object.defineProperty(window, 'localStorage', { value: storage, writable: true, configurable: true });
	return storage;
}

function readAllPending(): PendingPairing[] {
	const out: PendingPairing[] = [];
	for (let i = 0; i < window.localStorage.length; i++) {
		const key = window.localStorage.key(i);
		if (!key || !key.startsWith(STORAGE_KEY_PREFIX)) continue;
		const raw = window.localStorage.getItem(key);
		if (raw) out.push(JSON.parse(raw) as PendingPairing);
	}
	return out;
}

function readPendingFor(state: string): PendingPairing | null {
	const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${state}`);
	return raw ? (JSON.parse(raw) as PendingPairing) : null;
}

function writePending(entry: PendingPairing): void {
	window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${entry.state}`, JSON.stringify(entry));
}

describe('startPairing', () => {
	let openSpy: ReturnType<typeof vi.fn>;
	let getRandomValuesSpy: ReturnType<typeof vi.spyOn>;
	let digestSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		installFakeLocalStorage();
		openSpy = vi.fn();
		Object.defineProperty(window, 'open', { value: openSpy, writable: true, configurable: true });
		getRandomValuesSpy = vi.spyOn(window.crypto, 'getRandomValues');
		digestSpy = vi.spyOn(window.crypto.subtle, 'digest');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('writes a per-state pending entry to localStorage', async () => {
		await startPairing('http://127.0.0.1:47821', 'https://beak.web/agent/pair/return');

		const all = readAllPending();
		expect(all).toHaveLength(1);
		const pending = all[0];
		expect(pending.baseUrl).toBe('http://127.0.0.1:47821');
		expect(pending.state.length).toBeGreaterThan(0);
		expect(pending.codeVerifier.length).toBeGreaterThan(0);
		expect(typeof pending.startedAt).toBe('number');

		// The key must include the state so the return tab can find it
		// without knowing anything else about the pairing.
		expect(window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${pending.state}`)).not.toBeNull();
	});

	it('uses CSPRNG for both the state nonce and the PKCE verifier', async () => {
		await startPairing('http://127.0.0.1:47821', 'https://beak.web/agent/pair/return');
		expect(getRandomValuesSpy).toHaveBeenCalledTimes(2);
	});

	it('derives the code_challenge via SHA-256 (S256, per RFC 7636)', async () => {
		await startPairing('http://127.0.0.1:47821', 'https://beak.web/agent/pair/return');
		expect(digestSpy).toHaveBeenCalled();
		expect(digestSpy.mock.calls[0]?.[0]).toBe('SHA-256');
	});

	it('opens the pair URL with state, code_challenge, method=S256, origin and return', async () => {
		await startPairing('http://127.0.0.1:47821', 'https://beak.web/agent/pair/return');

		expect(openSpy).toHaveBeenCalledTimes(1);
		const [rawUrl, target, features] = openSpy.mock.calls[0] as [string, string, string];
		const url = new URL(rawUrl);
		expect(url.origin).toBe('http://127.0.0.1:47821');
		expect(url.pathname).toBe(AGENT_PAIR_PATH);
		expect(url.searchParams.get('state')?.length ?? 0).toBeGreaterThan(0);
		expect(url.searchParams.get('code_challenge')?.length ?? 0).toBeGreaterThan(0);
		expect(url.searchParams.get('code_challenge_method')).toBe('S256');
		expect(url.searchParams.get('return')).toBe('https://beak.web/agent/pair/return');
		expect(url.searchParams.get('origin')).toBe(window.location.origin);
		expect(target).toBe('_blank');
		expect(features).toContain('noopener');
	});

	it('concurrent pairings coexist (per-state keys)', async () => {
		await startPairing('http://127.0.0.1:47821', 'https://beak.web/agent/pair/return');
		await startPairing('http://127.0.0.1:47821', 'https://beak.web/agent/pair/return');
		const all = readAllPending();
		expect(all).toHaveLength(2);
		expect(all[0].state).not.toBe(all[1].state);
		expect(all[0].codeVerifier).not.toBe(all[1].codeVerifier);
	});

	it('sweeps pending entries older than 5 minutes on next call', async () => {
		const ancient: PendingPairing = {
			state: 'ancient-state',
			codeVerifier: 'x'.repeat(43),
			baseUrl: 'http://127.0.0.1:47821',
			startedAt: Date.now() - 6 * 60 * 1000, // 6 min ago
		};
		writePending(ancient);
		expect(readPendingFor('ancient-state')).not.toBeNull();

		await startPairing('http://127.0.0.1:47821', 'https://beak.web/agent/pair/return');

		expect(readPendingFor('ancient-state')).toBeNull();
		expect(readAllPending()).toHaveLength(1);
	});
});

describe('completePairing', () => {
	let fetchSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		installFakeLocalStorage();
		fetchSpy = vi.fn();
		Object.defineProperty(window, 'fetch', { value: fetchSpy, writable: true, configurable: true });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	function seedPending(state: string): PendingPairing {
		const entry: PendingPairing = {
			state,
			codeVerifier: 'a'.repeat(43),
			baseUrl: 'http://127.0.0.1:47821',
			startedAt: Date.now(),
		};
		writePending(entry);
		return entry;
	}

	function jsonResponse(body: unknown, ok = true, status = 200): Response {
		return {
			ok,
			status,
			text: () => Promise.resolve(''),
			json: () => Promise.resolve(body),
		} as unknown as Response;
	}

	it('rejects when the query carries an agent error', async () => {
		await expect(completePairing({ state: null, code: null, error: 'access_denied' })).rejects.toThrow(
			/pairing_access_denied/,
		);
	});

	it('rejects when code or state is missing', async () => {
		await expect(completePairing({ state: 's1', code: null, error: null })).rejects.toThrow(
			/pairing_missing_code_or_state/,
		);
		await expect(completePairing({ state: null, code: 'c1', error: null })).rejects.toThrow(
			/pairing_missing_code_or_state/,
		);
	});

	it('rejects with pairing_no_pending when localStorage has nothing for the state', async () => {
		await expect(completePairing({ state: 's1', code: 'c1', error: null })).rejects.toThrow(/pairing_no_pending/);
	});

	it('treats a non-JSON entry as expired (sweep evicts before lookup)', async () => {
		// The sweep runs before lookup and can't tell "corrupt" from "ancient"
		// — both are entries we don't trust. The user sees pairing_no_pending
		// and is invited to retry, which is the right outcome either way.
		window.localStorage.setItem(`${STORAGE_KEY_PREFIX}s1`, '{ not json');
		await expect(completePairing({ state: 's1', code: 'c1', error: null })).rejects.toThrow(/pairing_no_pending/);
	});

	it('rejects with pairing_state_mismatch when the entry body disagrees with the URL state', async () => {
		// Hand-build an entry where the key says one state but the body
		// claims another. The integrity check in completePairing should
		// catch the mismatch even though the lookup succeeds.
		window.localStorage.setItem(
			`${STORAGE_KEY_PREFIX}query-state`,
			JSON.stringify({
				state: 'body-state',
				codeVerifier: 'v'.repeat(43),
				baseUrl: 'http://127.0.0.1:47821',
				startedAt: Date.now(),
			}),
		);
		await expect(completePairing({ state: 'query-state', code: 'c1', error: null })).rejects.toThrow(
			/pairing_state_mismatch/,
		);
	});

	it('POSTs to /pair/token with code and code_verifier', async () => {
		const entry = seedPending('s1');
		fetchSpy.mockResolvedValue(jsonResponse({ token: 'tok', tokenId: 'kid' }));

		await completePairing({ state: 's1', code: 'c1', error: null });

		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
		expect(url).toBe(`${entry.baseUrl}${AGENT_PAIR_TOKEN_PATH}`);
		expect(init.method).toBe('POST');
		expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
		expect(init.credentials).toBe('omit');
		const body = JSON.parse(init.body as string);
		expect(body).toEqual({ code: 'c1', code_verifier: 'a'.repeat(43) });
	});

	it('surfaces the HTTP status when the token exchange fails', async () => {
		seedPending('s1');
		fetchSpy.mockResolvedValue(jsonResponse({}, false, 401));

		await expect(completePairing({ state: 's1', code: 'c1', error: null })).rejects.toThrow(
			/pairing_token_exchange_failed_401/,
		);
	});

	it('returns { token, tokenId, baseUrl } and removes the matching entry on success', async () => {
		const entry = seedPending('s1');
		// Seed a second concurrent pairing to prove only the matched entry is removed.
		seedPending('s2');
		fetchSpy.mockResolvedValue(jsonResponse({ token: 'tok', tokenId: 'kid' }));

		const result = await completePairing({ state: 's1', code: 'c1', error: null });

		expect(result).toEqual({ token: 'tok', tokenId: 'kid', baseUrl: entry.baseUrl });
		expect(readPendingFor('s1')).toBeNull();
		expect(readPendingFor('s2')).not.toBeNull();
	});

	it('rejects when the token response fails Zod validation', async () => {
		seedPending('s1');
		fetchSpy.mockResolvedValue(jsonResponse({ token: 'tok' /* tokenId missing */ }));

		await expect(completePairing({ state: 's1', code: 'c1', error: null })).rejects.toThrow(
			/pairing_invalid_token_response/,
		);
	});

	it('leaves the pending entry untouched when the token exchange fails', async () => {
		// Documents current behaviour: a 401 leaves the entry so the user
		// can retry without re-issuing PKCE. Clearing on failure would
		// trade convenience for a marginal security gain.
		const entry = seedPending('s1');
		fetchSpy.mockResolvedValue(jsonResponse({}, false, 401));

		await completePairing({ state: 's1', code: 'c1', error: null }).catch(() => undefined);

		expect(readPendingFor('s1')).toEqual(entry);
	});
});

describe('clearPending', () => {
	beforeEach(() => {
		installFakeLocalStorage();
	});

	it('sweeps expired entries and leaves fresh ones', () => {
		writePending({
			state: 'fresh',
			codeVerifier: 'a'.repeat(43),
			baseUrl: 'http://127.0.0.1:47821',
			startedAt: Date.now(),
		});
		writePending({
			state: 'stale',
			codeVerifier: 'b'.repeat(43),
			baseUrl: 'http://127.0.0.1:47821',
			startedAt: Date.now() - 6 * 60 * 1000,
		});

		clearPending();

		expect(readPendingFor('fresh')).not.toBeNull();
		expect(readPendingFor('stale')).toBeNull();
	});
});

describe('readPairingReturnQuery', () => {
	it('parses state, code, and error from a search string', () => {
		expect(readPairingReturnQuery('?state=s1&code=c1')).toEqual({ state: 's1', code: 'c1', error: null });
		expect(readPairingReturnQuery('?error=access_denied&state=s1')).toEqual({
			state: 's1',
			code: null,
			error: 'access_denied',
		});
		expect(readPairingReturnQuery('')).toEqual({ state: null, code: null, error: null });
	});
});
