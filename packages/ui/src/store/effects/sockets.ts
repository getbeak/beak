import type {
	SocketClosedPayload,
	SocketFailedPayload,
	SocketMessageInPayload,
	SocketOpenedPayload,
} from '@beak/common/types/socket';
import {
	closeSocket,
	openSocket,
	sendSocketMessage,
	socketClosed,
	socketConnecting,
	socketFailed,
	socketMessageReceived,
	socketOpened,
} from '@beak/state/sockets';
import { ipcSocketService } from '@beak/ui/lib/ipc';

import type { AppStartListening } from '../listener';

/**
 * Renderer-side WebSocket orchestration. Mirrors the flight effect's pattern
 * of installing a single permanent set of IPC listeners and routing each
 * event to the owning session by `socketId`, so concurrent sockets don't
 * stomp on each other.
 *
 * Dispatch is captured on first use (any `openSocket` etc. effect runs after
 * the store exists, so `api.dispatch` is always live). The captured ref is
 * then used by the IPC listeners, which fire outside of any effect.
 */
type AppDispatch = (action: { type: string; [k: string]: unknown }) => unknown;

let ipcListenersInstalled = false;
let dispatchRef: AppDispatch | null = null;

function ensureIpcListeners(dispatch: AppDispatch) {
	dispatchRef = dispatch;
	if (ipcListenersInstalled) return;
	ipcListenersInstalled = true;

	ipcSocketService.registerOpened(async (_e, payload: SocketOpenedPayload) => {
		dispatchRef?.(socketOpened(payload));
	});
	ipcSocketService.registerMessage(async (_e, payload: SocketMessageInPayload) => {
		dispatchRef?.(socketMessageReceived(payload));
	});
	ipcSocketService.registerClosed(async (_e, payload: SocketClosedPayload) => {
		dispatchRef?.(socketClosed(payload));
	});
	ipcSocketService.registerFailed(async (_e, payload: SocketFailedPayload) => {
		dispatchRef?.(socketFailed(payload));
	});
}

export function registerSocketEffects(start: AppStartListening) {
	start({
		actionCreator: openSocket,
		effect: async ({ payload }, api) => {
			ensureIpcListeners(api.dispatch as AppDispatch);
			api.dispatch(socketConnecting(payload));

			try {
				await ipcSocketService.open({
					socketId: payload.socketId,
					requestId: payload.requestId,
					url: payload.url,
					protocols: payload.protocols,
					headers: payload.headers,
				});
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				api.dispatch(socketFailed({ socketId: payload.socketId, timestamp: Date.now(), message }));
			}
		},
	});

	start({
		actionCreator: sendSocketMessage,
		effect: async ({ payload }, api) => {
			try {
				await ipcSocketService.send(payload);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				api.dispatch(socketFailed({ socketId: payload.socketId, timestamp: Date.now(), message }));
			}
		},
	});

	start({
		actionCreator: closeSocket,
		effect: async ({ payload }, api) => {
			try {
				await ipcSocketService.close(payload);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				api.dispatch(socketFailed({ socketId: payload.socketId, timestamp: Date.now(), message }));
			}
		},
	});
}
