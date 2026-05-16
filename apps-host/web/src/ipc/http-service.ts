import { type FetchTextReq, type FetchTextRes, IpcHttpServiceMain } from '@beak/common/ipc/http';

import { webIpcMain } from './ipc';

const service = new IpcHttpServiceMain(webIpcMain);

const DEFAULT_TIMEOUT_MS = 30_000;

service.registerFetchText(async (_event, payload: FetchTextReq): Promise<FetchTextRes> => {
	const parsed = parseUrl(payload.url);
	if (!parsed) {
		return { status: 0, ok: false, body: `Unsupported URL scheme: ${payload.url}` };
	}

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), payload.timeoutMs ?? DEFAULT_TIMEOUT_MS);
	try {
		const headers: Record<string, string> = {
			Accept: 'application/json, text/yaml, application/yaml, text/plain;q=0.9, */*;q=0.5',
			...payload.headers,
		};
		// In the web shell we hit the browser's fetch; CORS rules apply. We
		// don't proxy because there's no backend — users who need to sync
		// from CORS-locked specs should either save the file locally or use
		// the desktop app. The error surface (status 0) is the same either
		// way.
		const res = await fetch(parsed.href, { signal: controller.signal, headers });
		const body = await res.text();
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
});

function parseUrl(input: string): URL | null {
	try {
		const url = new URL(input);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
		return url;
	} catch {
		return null;
	}
}
