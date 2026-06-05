import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchText, makeCappedBodyReader, parseHttpUrl } from '../fetch-text';

describe('parseHttpUrl', () => {
	it('accepts http: URLs', () => {
		const url = parseHttpUrl('http://example.com/spec.json');
		expect(url).not.toBeNull();
		expect(url?.protocol).toBe('http:');
	});

	it('accepts https: URLs', () => {
		const url = parseHttpUrl('https://example.com/spec.json');
		expect(url?.protocol).toBe('https:');
	});

	it('rejects file: URLs', () => {
		expect(parseHttpUrl('file:///etc/passwd')).toBeNull();
	});

	it('rejects ftp: URLs', () => {
		expect(parseHttpUrl('ftp://example.com/x')).toBeNull();
	});

	it('rejects garbage input without throwing', () => {
		expect(parseHttpUrl('not a url')).toBeNull();
		expect(parseHttpUrl('')).toBeNull();
	});
});

describe('fetchText', () => {
	let originalFetch: typeof globalThis.fetch | undefined;

	beforeEach(() => {
		originalFetch = globalThis.fetch;
	});

	afterEach(() => {
		globalThis.fetch = originalFetch as typeof globalThis.fetch;
	});

	it('returns a structured error for unsupported schemes without calling fetch', async () => {
		const fetchSpy = vi.fn();
		globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;

		const res = await fetchText({ url: 'file:///etc/passwd', headers: {} }, { readBody: async r => await r.text() });

		expect(res.ok).toBe(false);
		expect(res.status).toBe(0);
		expect(res.body).toMatch(/Unsupported URL scheme/);
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('returns body + status + content-type on success', async () => {
		globalThis.fetch = vi.fn(
			async () =>
				new Response('{"hello":"world"}', {
					status: 200,
					headers: { 'content-type': 'application/json' },
				}),
		) as unknown as typeof globalThis.fetch;

		const res = await fetchText(
			{ url: 'https://example.com/spec.json', headers: {} },
			{ readBody: async r => await r.text() },
		);

		expect(res.ok).toBe(true);
		expect(res.status).toBe(200);
		expect(res.body).toBe('{"hello":"world"}');
		expect(res.contentType).toBe('application/json');
	});

	it('merges defaultHeaders, then payload headers (payload wins)', async () => {
		let seen: Record<string, string> = {};
		globalThis.fetch = vi.fn(async (_url: unknown, init?: RequestInit) => {
			const h = init?.headers as Record<string, string>;
			seen = h;
			return new Response('ok', { status: 200, headers: { 'content-type': 'text/plain' } });
		}) as unknown as typeof globalThis.fetch;

		await fetchText(
			{ url: 'https://example.com/x', headers: { 'X-Override': 'payload', Accept: 'application/yaml' } },
			{ readBody: async r => await r.text(), defaultHeaders: { 'User-Agent': 'Beak/test', 'X-Override': 'default' } },
		);

		expect(seen['User-Agent']).toBe('Beak/test');
		expect(seen['X-Override']).toBe('payload');
		expect(seen.Accept).toBe('application/yaml');
	});

	it('returns a structured error when fetch throws', async () => {
		globalThis.fetch = vi.fn(async () => {
			throw new Error('network down');
		}) as unknown as typeof globalThis.fetch;

		const res = await fetchText({ url: 'https://example.com/x', headers: {} }, { readBody: async r => await r.text() });

		expect(res.ok).toBe(false);
		expect(res.status).toBe(0);
		expect(res.body).toMatch(/network down/);
	});

	it('aborts on timeout and returns a structured error', async () => {
		globalThis.fetch = vi.fn(async (_url: unknown, init?: RequestInit) => {
			return await new Promise<Response>((_resolve, reject) => {
				const signal = init?.signal;
				signal?.addEventListener('abort', () => {
					reject(new DOMException('aborted', 'AbortError'));
				});
			});
		}) as unknown as typeof globalThis.fetch;

		const res = await fetchText(
			{ url: 'https://example.com/x', headers: {}, timeoutMs: 25 },
			{ readBody: async r => await r.text() },
		);

		expect(res.ok).toBe(false);
		expect(res.status).toBe(0);
	});

	it('propagates the cap from makeCappedBodyReader through readBody', async () => {
		const big = 'x'.repeat(50);
		globalThis.fetch = vi.fn(
			async () => new Response(big, { status: 200, headers: { 'content-type': 'text/plain' } }),
		) as unknown as typeof globalThis.fetch;

		const res = await fetchText(
			{ url: 'https://example.com/big.txt', headers: {} },
			{ readBody: makeCappedBodyReader(10) },
		);

		expect(res.ok).toBe(false);
		expect(res.body).toMatch(/exceeds 10 bytes/);
	});
});

describe('makeCappedBodyReader', () => {
	it('reads small responses fully', async () => {
		const reader = makeCappedBodyReader(1024);
		const res = new Response('hello world');
		const out = await reader(res);
		expect(out).toBe('hello world');
	});

	it('throws once the cap is exceeded', async () => {
		const reader = makeCappedBodyReader(5);
		const res = new Response('hello world');
		await expect(reader(res)).rejects.toThrow(/exceeds 5 bytes/);
	});

	it('falls back to res.text() when the response has no streaming body', async () => {
		const reader = makeCappedBodyReader(1024);
		// Construct a Response and replace its body getter with undefined to
		// force the fallback path.
		const res = new Response('fallback');
		Object.defineProperty(res, 'body', { value: undefined });
		const out = await reader(res);
		expect(out).toBe('fallback');
	});
});
