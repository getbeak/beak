import { ipcStreamService } from '@beak/ui/lib/ipc';

import { streamRegistry } from './registry';

/**
 * Wire the renderer-side {@link StreamRegistry} to the streams IPC
 * channel. Registered once at module import time (matching the
 * `features/variables/ipc.ts` pattern). Handles incoming `Pull` and
 * `Cancel` messages from the host.
 *
 * The Pull → PullResponse round-trip is serialised by the requester
 * (one pull at a time per stream), so we don't need to worry about
 * concurrent reads on the same reader.
 */
ipcStreamService.registerPull(async (_event, payload) => {
	try {
		const { chunk, done } = await streamRegistry.pull(payload.streamId);
		await ipcStreamService.respondPull({
			streamId: payload.streamId,
			requestId: payload.requestId,
			chunk,
			done,
		});
	} catch (err) {
		await ipcStreamService.respondPull({
			streamId: payload.streamId,
			requestId: payload.requestId,
			done: true,
			error: err instanceof Error ? err.message : String(err),
		});
	}
});

ipcStreamService.registerCancel((_event, payload) => {
	streamRegistry.cancel(payload.streamId);
});
