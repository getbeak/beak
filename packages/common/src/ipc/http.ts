import { z } from 'zod';

import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

/**
 * Minimal HTTP fetch on the host side. The renderer can't make outbound
 * HTTP requests directly — partly to dodge CORS in the web shell, partly so
 * we keep a single chokepoint to log/audit fetches from. Today the only
 * caller is the OpenAPI sync poller (Project Home), but the channel is
 * deliberately generic so other features can borrow it.
 *
 * Security note: this proxies arbitrary URLs on behalf of the renderer.
 * The renderer is treated as untrusted because it runs extension code, so
 * we reject `file://`, `data:`, and intra-renderer schemes server-side and
 * surface a status code rather than the raw fetch error.
 */
const fetchTextSchema = z.object({
	url: z.string().min(1),
	headers: z.record(z.string(), z.string()).optional(),
	timeoutMs: z.number().int().min(1).max(120_000).optional(),
});

export const HttpMessages = {
	FetchText: 'fetch_text',
} as const;

export interface FetchTextReq {
	/** Absolute URL — `http:` or `https:` only. */
	url: string;
	/** Optional request headers. The host adds a default `Accept` if none provided. */
	headers?: Record<string, string>;
	/** Per-call timeout in ms. Defaults to 30s on the host side. */
	timeoutMs?: number;
}

export interface FetchTextRes {
	/** HTTP status code; 0 when the request never completed (network/abort). */
	status: number;
	/** Convenience flag for 2xx responses. */
	ok: boolean;
	/** Response body as text. Empty string when status is 0. */
	body: string;
	/** Verbatim `Content-Type` header from the response, if any. */
	contentType?: string;
}

export class IpcHttpServiceRenderer extends IpcServiceRenderer<'http'> {
	constructor(ipc: PartialIpcRenderer) {
		super('http', ipc);
	}

	async fetchText(payload: FetchTextReq) {
		return this.invoke<FetchTextRes>(HttpMessages.FetchText, payload);
	}
}

export class IpcHttpServiceMain extends IpcServiceMain<'http'> {
	constructor(ipc: PartialIpcMain) {
		super('http', ipc);
	}

	registerFetchText(fn: IpcListener<FetchTextReq>) {
		this.registerRequestHandler(HttpMessages.FetchText, fn, fetchTextSchema as never);
	}
}
