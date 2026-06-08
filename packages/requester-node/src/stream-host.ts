import { Readable } from 'node:stream';

/**
 * Dependency-inverted hook the host installs to give the requester a
 * way to pull bytes from a renderer-backed stream. The requester only
 * sees streamId; the host knows how to translate that into IPC.
 *
 * `pull` blocks until the renderer responds with the next chunk
 * (or `done: true`). `cancel` is best-effort fire-and-forget.
 *
 * `webContents` is `unknown` here so the requester package stays free
 * of an Electron dependency — the host passes whatever shape its IPC
 * layer needs through the hook signature.
 */
export interface StreamHost {
	pull: (
		webContents: unknown,
		streamId: string,
		byteHint: number,
	) => Promise<{ chunk?: Uint8Array; done: boolean; error?: string }>;
	cancel: (webContents: unknown, streamId: string) => void;
}

let installedHost: StreamHost | null = null;

export function registerStreamHost(host: StreamHost): void {
	installedHost = host;
}

export function getStreamHost(): StreamHost | null {
	return installedHost;
}

/**
 * Build a Node `Readable` whose `read()` pulls bytes from the registered
 * renderer-backed stream. Used as `node-fetch`'s request body for
 * stream-typed producers — the request flows out at the cadence the
 * renderer produces, not at IPC's full rate.
 */
export function streamProducerToReadable(webContents: unknown, streamId: string, chunkSize = 64 * 1024): Readable {
	const host = getStreamHost();
	if (!host)
		throw new Error('no stream host installed — bootstrap is incomplete or the renderer never opened a stream channel');

	let closed = false;

	return new Readable({
		async read() {
			if (closed) {
				this.push(null);
				return;
			}
			try {
				const { chunk, done, error } = await host.pull(webContents, streamId, chunkSize);
				if (error) {
					this.destroy(new Error(error));
					return;
				}
				if (chunk) this.push(chunk);
				if (done) {
					this.push(null);
					closed = true;
				}
			} catch (err) {
				this.destroy(err instanceof Error ? err : new Error(String(err)));
			}
		},
		destroy(err, cb) {
			closed = true;
			host.cancel(webContents, streamId);
			cb(err);
		},
	});
}
