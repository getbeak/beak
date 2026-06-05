/**
 * WebSocket session IPC types. Renderer drives lifecycle via `open` / `send` /
 * `close` invokes; host pushes lifecycle/message events back as fire-and-forget
 * messages. Binary frames are transported as base64 to keep the IPC payload
 * structured-cloneable across the Electron contextBridge boundary without
 * paying for transferable-buffer plumbing — fine for the message sizes a
 * tester is likely to inspect interactively.
 */

export type SocketMessageKind = 'text' | 'binary';

export interface SocketRequestHeader {
	name: string;
	value: string;
}

/**
 * Renderer → host: open a new socket. The renderer mints the `socketId`
 * (ksuid) up-front so it can route incoming events to the right slot in the
 * store without waiting for an open-ack round-trip.
 */
export interface OpenSocketRequest {
	socketId: string;
	requestId: string;
	url: string;
	protocols?: string[];
	/**
	 * Custom headers. Only honoured on hosts where the underlying WebSocket
	 * implementation supports them (Electron / Node). The browser shell
	 * silently ignores this — `WebSocket` in the DOM cannot set headers.
	 */
	headers?: SocketRequestHeader[];
}

/**
 * Renderer → host: push a text frame. Binary sends use the same shape with
 * `kind: 'binary'` and `data` base64-encoded; the host decodes before send.
 */
export interface SendSocketMessageRequest {
	socketId: string;
	kind: SocketMessageKind;
	data: string;
}

export interface CloseSocketRequest {
	socketId: string;
	code?: number;
	reason?: string;
}

// Host → renderer event payloads.

export interface SocketOpenedPayload {
	socketId: string;
	timestamp: number;
	protocol: string;
	extensions: string;
}

export interface SocketMessageInPayload {
	socketId: string;
	timestamp: number;
	kind: SocketMessageKind;
	/** UTF-8 string for `kind: 'text'`, base64 for `kind: 'binary'`. */
	data: string;
	size: number;
}

export interface SocketClosedPayload {
	socketId: string;
	timestamp: number;
	code: number;
	reason: string;
	wasClean: boolean;
}

export interface SocketFailedPayload {
	socketId: string;
	timestamp: number;
	message: string;
}
