import type { FetchTextReq, FetchTextRes } from '@beak/common/ipc/http';

/**
 * Shared text-fetch implementation for both hosts. The body of the HTTP
 * fetch handler is identical in shape across electron + web — URL parse,
 * timeout-controlled fetch, header merge, structured error surface. The
 * only divergence is how the body bytes get read: electron caps at 16MB
 * via a streaming reader to stop a runaway spec download, web uses
 * `res.text()` directly (the browser caps memory for us).
 *
 * Both hosts call this with their own `readBody` strategy.
 */

export interface FetchTextDeps {
	/**
	 * Read the response body as text. Implementations:
	 *  - electron: streams + caps at MAX_BODY_BYTES.
	 *  - web: `res.text()` directly.
	 */
	readBody: (res: Response) => Promise<string>;
	/**
	 * Extra default headers (e.g. electron sends `User-Agent: Beak/openapi-sync`).
	 * Per-call payload headers always win.
	 */
	defaultHeaders?: Record<string, string>;
}

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Validate + parse an arbitrary URL, restricted to http: / https:.
 * Returns `null` for unsupported schemes (file://, ftp://, etc.) so the
 * caller can short-circuit with a structured "Unsupported URL scheme"
 * response instead of bubbling a thrown error.
 */
export function parseHttpUrl(input: string): URL | null {
	try {
		const url = new URL(input);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
		return url;
	} catch {
		return null;
	}
}

export async function fetchText(payload: FetchTextReq, deps: FetchTextDeps): Promise<FetchTextRes> {
	const parsed = parseHttpUrl(payload.url);
	if (!parsed) return { status: 0, ok: false, body: `Unsupported URL scheme: ${payload.url}` };

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), payload.timeoutMs ?? DEFAULT_TIMEOUT_MS);
	try {
		const headers: Record<string, string> = {
			Accept: 'application/json, text/yaml, application/yaml, text/plain;q=0.9, */*;q=0.5',
			...(deps.defaultHeaders ?? {}),
			...payload.headers,
		};
		const res = await fetch(parsed.href, { signal: controller.signal, headers });
		const body = await deps.readBody(res);
		return {
			status: res.status,
			ok: res.ok,
			body,
			contentType: res.headers.get('content-type') ?? undefined,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return { status: 0, ok: false, body: `Fetch failed: ${message}` };
	} finally {
		clearTimeout(timer);
	}
}

/**
 * Streaming body reader with a hard byte cap. Electron uses this so a
 * compromised renderer can't ask Beak to hold a 5GB document in memory.
 * Web doesn't need it — the browser already enforces memory limits via
 * the JS heap. Exported here so electron's host can pass it as `readBody`.
 */
export function makeCappedBodyReader(maxBytes: number): (res: Response) => Promise<string> {
	return async (res: Response) => {
		const reader = res.body?.getReader();
		if (!reader) return res.text();
		const decoder = new TextDecoder();
		let total = 0;
		let out = '';
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			if (!value) continue;
			total += value.byteLength;
			if (total > maxBytes) {
				await reader.cancel();
				throw new Error(`Response exceeds ${maxBytes} bytes`);
			}
			out += decoder.decode(value, { stream: true });
		}
		out += decoder.decode();
		return out;
	};
}
