import { type FetchTextReq, type FetchTextRes, IpcHttpServiceMain } from '@beak/common/ipc/http';
import { ipcMain } from 'electron';

const service = new IpcHttpServiceMain(ipcMain);

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_BODY_BYTES = 16 * 1024 * 1024; // 16MB — OpenAPI specs are small; ceiling stops runaway downloads.

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
			'User-Agent': 'Beak/openapi-sync',
			...payload.headers,
		};
		const res = await fetch(parsed.href, { signal: controller.signal, headers });
		const text = await readCapped(res);
		return {
			status: res.status,
			ok: res.ok,
			body: text,
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

async function readCapped(res: Response): Promise<string> {
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
		if (total > MAX_BODY_BYTES) {
			await reader.cancel();
			throw new Error(`Response exceeds ${MAX_BODY_BYTES} bytes`);
		}
		out += decoder.decode(value, { stream: true });
	}
	out += decoder.decode();
	return out;
}
