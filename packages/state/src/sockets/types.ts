/**
 * Slice types for WebSocket sessions. A "socket" lives in parallel to a
 * "flight" — when the user fires a request whose URL is `ws://`/`wss://`, the
 * Header dispatches `openSocket` instead of `requestFlight` and the session
 * is keyed by its own `socketId`. Multiple sockets per request are allowed
 * (mirroring concurrent flights) and tracked via `socketsByRequest`.
 */

export type SocketStatus = 'connecting' | 'open' | 'closing' | 'closed' | 'failed';

export type SocketMessageDirection = 'in' | 'out' | 'system';

export type SocketMessageKind = 'text' | 'binary' | 'system';

export interface SocketMessage {
	id: string;
	direction: SocketMessageDirection;
	kind: SocketMessageKind;
	/** UTF-8 string for text + system messages, base64 for binary. */
	data: string;
	/** Size of the actual payload in bytes (decoded length for binary). */
	size: number;
	receivedAt: number;
}

export interface SocketRequestHeader {
	name: string;
	value: string;
}

export interface SocketSession {
	socketId: string;
	requestId: string;
	url: string;
	protocols?: string[];
	headers?: SocketRequestHeader[];
	status: SocketStatus;
	openedAt?: number;
	closedAt?: number;
	closeCode?: number;
	closeReason?: string;
	wasClean?: boolean;
	negotiatedProtocol?: string;
	extensions?: string;
	errorMessage?: string;
	messages: SocketMessage[];
	bytesIn: number;
	bytesOut: number;
	messagesIn: number;
	messagesOut: number;
}

// Action payloads.

export interface OpenSocketPayload {
	socketId: string;
	requestId: string;
	url: string;
	protocols?: string[];
	headers?: SocketRequestHeader[];
}

export interface SocketOpenedPayload {
	socketId: string;
	timestamp: number;
	protocol: string;
	extensions: string;
}

export interface SocketIncomingMessagePayload {
	socketId: string;
	timestamp: number;
	kind: 'text' | 'binary';
	data: string;
	size: number;
}

export interface SendSocketMessagePayload {
	socketId: string;
	kind: 'text' | 'binary';
	/** UTF-8 string for text, base64 for binary. */
	data: string;
}

export interface SocketMessageSentPayload {
	socketId: string;
	timestamp: number;
	kind: 'text' | 'binary';
	data: string;
	size: number;
}

export interface CloseSocketPayload {
	socketId: string;
	code?: number;
	reason?: string;
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

export interface ClearSocketPayload {
	socketId: string;
}
