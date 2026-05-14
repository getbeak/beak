import { Buffer } from 'node:buffer';

import { IpcSocketServiceMain } from '@beak/common/ipc/socket';
import { type IpcMainInvokeEvent, ipcMain, type WebContents } from 'electron';

/**
 * Host-side WebSocket bridge. Uses the Node 22+ global `WebSocket` (Electron
 * 42 ships Node 24). One open socket per `socketId`; the renderer mints the
 * id up-front so it can route events without an open-ack round-trip.
 *
 * Custom request headers from the renderer are currently ignored — Node's
 * built-in `WebSocket` doesn't expose a headers option (the `ws` package
 * would). We accept the field on the wire so the v0 protocol doesn't churn
 * when we wire it up later.
 */
const service = new IpcSocketServiceMain(ipcMain);

interface OpenSocket {
	ws: WebSocket;
	sender: WebContents;
}

const sockets = new Map<string, OpenSocket>();

service.registerOpen(async (event, payload) => {
	const sender = (event as IpcMainInvokeEvent).sender;
	const { socketId, url, protocols } = payload;

	if (sockets.has(socketId)) {
		throw new Error(`socket ${socketId} already open`);
	}

	let ws: WebSocket;
	try {
		ws = new WebSocket(url, protocols);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		service.sendFailed(sender, { socketId, timestamp: Date.now(), message });
		return;
	}

	// Binary frames arrive as ArrayBuffer with this binaryType (the default in
	// the spec). Base64-encode them so the IPC payload is structured-cloneable
	// without transferable plumbing.
	ws.binaryType = 'arraybuffer';

	const open: OpenSocket = { ws, sender };
	sockets.set(socketId, open);

	ws.addEventListener('open', () => {
		service.sendOpened(sender, {
			socketId,
			timestamp: Date.now(),
			protocol: ws.protocol,
			extensions: ws.extensions,
		});
	});

	ws.addEventListener('message', (ev: MessageEvent) => {
		const timestamp = Date.now();
		if (typeof ev.data === 'string') {
			service.sendMessageIn(sender, {
				socketId,
				timestamp,
				kind: 'text',
				data: ev.data,
				size: Buffer.byteLength(ev.data, 'utf8'),
			});
		} else if (ev.data instanceof ArrayBuffer) {
			const buf = Buffer.from(ev.data);
			service.sendMessageIn(sender, {
				socketId,
				timestamp,
				kind: 'binary',
				data: buf.toString('base64'),
				size: buf.byteLength,
			});
		}
	});

	ws.addEventListener('close', (ev: CloseEvent) => {
		sockets.delete(socketId);
		service.sendClosed(sender, {
			socketId,
			timestamp: Date.now(),
			code: ev.code,
			reason: ev.reason,
			wasClean: ev.wasClean,
		});
	});

	ws.addEventListener('error', () => {
		// The `error` event carries no actionable detail on the standard API
		// (only on Node's `ws` package). `close` always follows; the renderer
		// surfaces the close code/reason. We still emit a failed marker so the
		// UI can flip status to 'failed' rather than 'closed' for non-1000
		// codes that arrive without a clean handshake.
		service.sendFailed(sender, {
			socketId,
			timestamp: Date.now(),
			message: 'WebSocket error',
		});
	});
});

service.registerSend(async (_event, payload) => {
	const open = sockets.get(payload.socketId);
	if (!open) throw new Error(`socket ${payload.socketId} not open`);

	if (open.ws.readyState !== WebSocket.OPEN) {
		throw new Error(`socket ${payload.socketId} not ready (state=${open.ws.readyState})`);
	}

	if (payload.kind === 'text') {
		open.ws.send(payload.data);
	} else {
		open.ws.send(Buffer.from(payload.data, 'base64'));
	}
});

service.registerClose(async (_event, payload) => {
	const open = sockets.get(payload.socketId);
	if (!open) return; // already gone — idempotent close
	try {
		open.ws.close(payload.code, payload.reason);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		service.sendFailed(open.sender, { socketId: payload.socketId, timestamp: Date.now(), message });
	}
});
