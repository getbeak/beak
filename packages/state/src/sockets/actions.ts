import { createAction } from '@reduxjs/toolkit';

import type {
	ClearSocketPayload,
	CloseSocketPayload,
	OpenSocketPayload,
	SendSocketMessagePayload,
	SocketClosedPayload,
	SocketFailedPayload,
	SocketIncomingMessagePayload,
	SocketMessageSentPayload,
	SocketOpenedPayload,
} from './types';

// User intent — picked up by the renderer effect, which calls the IPC.
export const openSocket = createAction<OpenSocketPayload>('sockets/openSocket');
export const sendSocketMessage = createAction<SendSocketMessagePayload>('sockets/sendSocketMessage');
export const closeSocket = createAction<CloseSocketPayload>('sockets/closeSocket');

// State transitions dispatched by the effect after IPC round-trips.
export const socketConnecting = createAction<OpenSocketPayload>('sockets/socketConnecting');
export const socketOpened = createAction<SocketOpenedPayload>('sockets/socketOpened');
export const socketMessageReceived = createAction<SocketIncomingMessagePayload>('sockets/socketMessageReceived');
export const socketMessageSent = createAction<SocketMessageSentPayload>('sockets/socketMessageSent');
export const socketClosing = createAction<CloseSocketPayload>('sockets/socketClosing');
export const socketClosed = createAction<SocketClosedPayload>('sockets/socketClosed');
export const socketFailed = createAction<SocketFailedPayload>('sockets/socketFailed');

// Allow the renderer to drop a session from state entirely (e.g. user closes
// the tab or wants to start a fresh log).
export const clearSocket = createAction<ClearSocketPayload>('sockets/clearSocket');
