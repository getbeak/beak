import { IpcSocketServiceMain } from '@beak/common/ipc/socket';

import { webIpcMain } from './ipc';

/**
 * Browser-shell WebSocket bridge. Mirrors the Electron host but uses the DOM
 * `WebSocket` constructor. Custom headers from the renderer are silently
 * ignored — the browser API doesn't expose them and there's no escape hatch.
 */
const service = new IpcSocketServiceMain(webIpcMain);
const sender = webIpcMain.webContents;

interface OpenSocket {
	ws: WebSocket;
}

const sockets = new Map<string, OpenSocket>();

function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
	return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
	const binary = atob(base64);
	const buffer = new ArrayBuffer(binary.length);
	const bytes = new Uint8Array(buffer);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return buffer;
}

service.registerOpen(async (_event, payload) => {
	const { socketId, url, protocols } = payload;

	if (sockets.has(socketId)) throw new Error(`socket ${socketId} already open`);

	let ws: WebSocket;
	try {
		ws = protocols && protocols.length > 0 ? new WebSocket(url, protocols) : new WebSocket(url);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		service.sendFailed(sender, { socketId, timestamp: Date.now(), message });
		return;
	}

	ws.binaryType = 'arraybuffer';
	sockets.set(socketId, { ws });

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
				size: new TextEncoder().encode(ev.data).length,
			});
		} else if (ev.data instanceof ArrayBuffer) {
			service.sendMessageIn(sender, {
				socketId,
				timestamp,
				kind: 'binary',
				data: arrayBufferToBase64(ev.data),
				size: ev.data.byteLength,
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
		open.ws.send(base64ToArrayBuffer(payload.data));
	}
});

service.registerClose(async (_event, payload) => {
	const open = sockets.get(payload.socketId);
	if (!open) return;
	try {
		open.ws.close(payload.code, payload.reason);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		service.sendFailed(sender, { socketId: payload.socketId, timestamp: Date.now(), message });
	}
});
