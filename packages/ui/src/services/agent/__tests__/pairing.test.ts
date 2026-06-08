import { AGENT_PAIR_PATH, AGENT_PAIR_TOKEN_PATH } from '@beak/common/wire/agent';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearPending, completePairing, readPairingReturnQuery, startPairing } from '../pairing';

/**
 * PKCE pairing flow tests. Security-sensitive: drive-test audit flagged
 * this as P0-untested. The flow uses `sessionStorage` (single pending
 * pairing per tab) by design — opening Beak twice gives two independent
 * pairings, which is the correct behaviour.
 */

const SESSION_STORAGE_KEY = 'beak.agent.pairing.pending';

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

function installFakeSessionStorage(): Storage {
	const storage = createMemoryStorage();
	Object.defineProperty(window, 'sessionStorage', { value: storage, writable: true, configurable: true });
	return storage;
}

function readPending(): PendingPairing | null {
	const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
	if (!raw) return null;
	return JSON.parse(raw) as PendingPairing;
}

function writePending(entry: PendingPairing): void {
	window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(entry));
}

describe('startPairing', () => {
	let openSpy: ReturnType<typeof vi.fn>;
	let getRandomValuesSpy: ReturnType<typeof vi.spyOn>;
	let digestSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		installFakeSessionStorage();
		openSpy = vi.fn();
		Object.defineProperty(window, 'open', { value: openSpy, writable: true, configurable: true });
		getRandomValuesSpy = vi.spyOn(window.crypto, 'getRandomValues');
		digestSpy = vi.spyOn(window.crypto.subtle, 'digest');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('writes a single pending entry to sessionStorage', async () => {
		await startPairing('http://127.0.0.1:47821', 'https://beak.web/agent/pair/return');

		const pending = readPending();
		expect(pending).not.toBeNull();
		expect(pending?.baseUrl).toBe('http://127.0.0.1:47821');
		expect(pending?.state.length).toBeGreaterThan(0);
		expect(pending?.codeVerifier.length).toBeGreaterThan(0);
		expect(typeof pending?.startedAt).toBe('number');
	});

	it('uses CSPRNG for both the state nonce and the PKCE verifier', async () => {
		await startPairing('http://127.0.0.1:47821', 'https://beak.web/agent/pair/return');

		// newState() does one getRandomValues; newPkcePair() does another.
		expect(getRandomValuesSpy).toHaveBeenCalledTimes(2);
	});

	it('derives the code_challenge via SHA-256 (S256, per RFC 7636)', async () => {
		await startPairing('http://127.0.0.1:47821', 'https://beak.web/agent/pair/return');

		expect(digestSpy).toHaveBeenCalled();
		const algo = digestSpy.mock.calls[0]?.[0];
		expect(algo).toBe('SHA-256');
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

	it('generates a different state and verifier on each call', async () => {
		await startPairing('http://127.0.0.1:47821', 'https://beak.web/agent/pair/return');
		const first = readPending();
		await startPairing('http://127.0.0.1:47821', 'https://beak.web/agent/pair/return');
		const second = readPending();
		expect(first?.state).not.toBe(second?.state);
		expect(first?.codeVerifier).not.toBe(second?.codeVerifier);
	});
});

describe('completePairing', () => {
	let fetchSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		installFakeSessionStorage();
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
		await expect(
			completePairing({ state: null, code: null, error: 'access_denied' }),
		).rejects.toThrow(/pairing_access_denied/);
	});

	it('rejects when code or state is missing', async () => {
		await expect(
			completePairing({ state: 's1', code: null, error: null }),
		).rejects.toThrow(/pairing_missing_code_or_state/);
		await expect(
			completePairing({ state: null, code: 'c1', error: null }),
		).rejects.toThrow(/pairing_missing_code_or_state/);
	});

	it('rejects with pairing_no_pending when sessionStorage has nothing', async () => {
		await expect(
			completePairing({ state: 's1', code: 'c1', error: null }),
		).rejects.toThrow(/pairing_no_pending/);
	});

	it('rejects with pairing_corrupt_pending when the entry is not JSON', async () => {
		window.sessionStorage.setItem(SESSION_STORAGE_KEY, '{ not json');
		await expect(
			completePairing({ state: 's1', code: 'c1', error: null }),
		).rejects.toThrow(/pairing_corrupt_pending/);
	});

	it('rejects with pairing_state_mismatch when the query state differs', async () => {
		seedPending('expected-state');
		await expect(
			completePairing({ state: 'attacker-state', code: 'c1', error: null }),
		).rejects.toThrow(/pairing_state_mismatch/);
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

		await expect(
			completePairing({ state: 's1', code: 'c1', error: null }),
		).rejects.toThrow(/pairing_token_exchange_failed_401/);
	});

	it('returns { token, tokenId, baseUrl } and clears pending on success', async () => {
		const entry = seedPending('s1');
		fetchSpy.mockResolvedValue(jsonResponse({ token: 'tok', tokenId: 'kid' }));

		const result = await completePairing({ state: 's1', code: 'c1', error: null });

		expect(result).toEqual({ token: 'tok', tokenId: 'kid', baseUrl: entry.baseUrl });
		expect(readPending()).toBeNull();
	});

	it('rejects when the token response fails Zod validation', async () => {
		seedPending('s1');
		fetchSpy.mockResolvedValue(jsonResponse({ token: 'tok' /* tokenId missing */ }));

		await expect(
			completePairing({ state: 's1', code: 'c1', error: null }),
		).rejects.toThrow(/pairing_invalid_token_response/);
	});

	it('leaves the pending entry untouched when the token exchange fails', async () => {
		// Documents current behaviour. Recovery from a 401 needs the user to
		// re-click `/pair/return` with the same state; clearing pending here
		// would lock them out. (Worth revisiting once tokens rotate, but the
		// fix lives in the spec, not this test.)
		const entry = seedPending('s1');
		fetchSpy.mockResolvedValue(jsonResponse({}, false, 401));

		await completePairing({ state: 's1', code: 'c1', error: null }).catch(() => undefined);

		expect(readPending()).toEqual(entry);
	});
});

describe('clearPending', () => {
	beforeEach(() => {
		installFakeSessionStorage();
	});

	it('removes the pending entry from sessionStorage', () => {
		window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ state: 's1' }));
		clearPending();
		expect(window.sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
	});
});

describe('readPairingReturnQuery', () => {
	it('parses state, code, and error from a search string', () => {
		expect(readPairingReturnQuery('?state=s1&code=c1')).toEqual({
			state: 's1',
			code: 'c1',
			error: null,
		});
		expect(readPairingReturnQuery('?error=access_denied&state=s1')).toEqual({
			state: 's1',
			code: null,
			error: 'access_denied',
		});
		expect(readPairingReturnQuery('')).toEqual({ state: null, code: null, error: null });
	});
});
