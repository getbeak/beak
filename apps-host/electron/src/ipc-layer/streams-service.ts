import { IpcStreamServiceMain, type PullResponsePayload } from '@beak/common/ipc/streams';
import ksuid from '@beak/ksuid';
import { registerStreamHost } from '@beak/requester-node';
import { ipcMain, type WebContents } from 'electron';

const service = new IpcStreamServiceMain(ipcMain);

/**
 * Per-(streamId, requestId) waiters. The requester calls `pull(streamId)`
 * and awaits the renderer's matching `PullResponse`. We tag each call
 * with a fresh `requestId` so concurrent pulls (multiple streams in
 * different flights) don't collide on a single waiter.
 */
const waiters = new Map<string, (response: PullResponsePayload) => void>();

service.registerPullResponse(async (_event, payload) => {
	const key = waiterKey(payload.streamId, payload.requestId);
	const resolve = waiters.get(key);
	if (!resolve) return; // late / cancelled
	waiters.delete(key);
	resolve(payload);
});

/**
 * Hand the requester a wire-bound `pull(streamId, byteHint)` it can use
 * to drive `node-fetch`'s Readable body. Wraps the request/response
 * round-trip; the requester doesn't see the IPC ceremony.
 */
registerStreamHost({
	pull: (wc, streamId, byteHint) => {
		return new Promise<{ chunk?: Uint8Array; done: boolean; error?: string }>(resolve => {
			const requestId = ksuid.generate('streampull').toString();
			waiters.set(waiterKey(streamId, requestId), resolve);
			service.pull(wc as WebContents, { streamId, requestId, byteHint });
		});
	},
	cancel: (wc, streamId) => {
		// Drop any pending waiters for this stream. Map.delete during
		// iteration is safe per ECMAScript spec — already-visited keys
		// stay, unvisited keys remain reachable.
		for (const key of waiters.keys()) {
			if (key.startsWith(`${streamId}:`)) waiters.delete(key);
		}
		service.cancel(wc as WebContents, { streamId });
	},
});

function waiterKey(streamId: string, requestId: string): string {
	return `${streamId}:${requestId}`;
}
