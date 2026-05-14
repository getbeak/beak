import { createSlice } from '@reduxjs/toolkit';

import {
	clearSocket,
	closeSocket,
	openSocket,
	sendSocketMessage,
	socketClosed,
	socketClosing,
	socketConnecting,
	socketFailed,
	socketMessageReceived,
	socketMessageSent,
	socketOpened,
} from './actions';
import type { SocketMessage, SocketSession } from './types';

export interface SocketsSliceState {
	/** All known socket sessions keyed by socketId. */
	sessions: Record<string, SocketSession>;
	/** Per-request index of socketIds in start order. */
	socketsByRequest: Record<string, string[]>;
}

const initialState: SocketsSliceState = {
	sessions: {},
	socketsByRequest: {},
};

/**
 * Cap on how many messages we keep per session — prevents an enthusiastic
 * server from blowing the renderer's heap. The user gets a system message
 * when the window slides.
 */
const MESSAGE_CAP = 2000;

function nextMessageId(session: SocketSession): string {
	// `socketId-N` is good enough for React keys and human inspection — no
	// other code reads these ids, so we don't need ksuids here.
	return `${session.socketId}-${session.messages.length + 1}`;
}

function pushMessage(session: SocketSession, message: SocketMessage) {
	session.messages.push(message);
	if (session.messages.length > MESSAGE_CAP) {
		const drop = session.messages.length - MESSAGE_CAP;
		session.messages.splice(0, drop);
	}
}

function pushSystemMessage(session: SocketSession, text: string, timestamp: number) {
	pushMessage(session, {
		id: nextMessageId(session),
		direction: 'system',
		kind: 'system',
		data: text,
		size: text.length,
		receivedAt: timestamp,
	});
}

function indexSession(state: SocketsSliceState, session: SocketSession) {
	state.sessions[session.socketId] = session;
	const existing = state.socketsByRequest[session.requestId] ?? [];
	if (!existing.includes(session.socketId)) {
		state.socketsByRequest[session.requestId] = [...existing, session.socketId];
	}
}

function dropSession(state: SocketsSliceState, socketId: string) {
	const session = state.sessions[socketId];
	if (!session) return;
	delete state.sessions[socketId];
	const remaining = (state.socketsByRequest[session.requestId] ?? []).filter(id => id !== socketId);
	if (remaining.length > 0) state.socketsByRequest[session.requestId] = remaining;
	else delete state.socketsByRequest[session.requestId];
}

const socketsSlice = createSlice({
	name: 'sockets',
	initialState,
	reducers: {},
	extraReducers: builder => {
		builder
			.addCase(openSocket, (state, action) => {
				// `openSocket` is the user intent — the effect will follow up with
				// `socketConnecting` once the IPC is dispatched. We seed the session
				// here so the UI can render immediately rather than wait a tick.
				const { socketId, requestId, url, protocols, headers } = action.payload;
				const session: SocketSession = {
					socketId,
					requestId,
					url,
					protocols,
					headers,
					status: 'connecting',
					messages: [],
					bytesIn: 0,
					bytesOut: 0,
					messagesIn: 0,
					messagesOut: 0,
				};
				indexSession(state, session);
				pushSystemMessage(session, `Connecting to ${url}…`, Date.now());
			})
			.addCase(socketConnecting, (state, action) => {
				const session = state.sessions[action.payload.socketId];
				if (!session) return;
				session.status = 'connecting';
			})
			.addCase(socketOpened, (state, action) => {
				const { socketId, timestamp, protocol, extensions } = action.payload;
				const session = state.sessions[socketId];
				if (!session) return;
				session.status = 'open';
				session.openedAt = timestamp;
				session.negotiatedProtocol = protocol || undefined;
				session.extensions = extensions || undefined;
				pushSystemMessage(session, `Connected${protocol ? ` (${protocol})` : ''}`, timestamp);
			})
			.addCase(socketMessageReceived, (state, action) => {
				const { socketId, timestamp, kind, data, size } = action.payload;
				const session = state.sessions[socketId];
				if (!session) return;
				session.messagesIn += 1;
				session.bytesIn += size;
				pushMessage(session, {
					id: nextMessageId(session),
					direction: 'in',
					kind,
					data,
					size,
					receivedAt: timestamp,
				});
			})
			.addCase(sendSocketMessage, (state, action) => {
				// Same "render before IPC settles" pattern as openSocket — the effect
				// will refine via `socketMessageSent` if/when the host acks, but the
				// UI doesn't need to wait.
				const { socketId, kind, data } = action.payload;
				const session = state.sessions[socketId];
				if (!session) return;
				const size = sizeOf(kind, data);
				session.messagesOut += 1;
				session.bytesOut += size;
				pushMessage(session, {
					id: nextMessageId(session),
					direction: 'out',
					kind,
					data,
					size,
					receivedAt: Date.now(),
				});
			})
			.addCase(socketMessageSent, () => {
				// No-op for now; the optimistic append in `sendSocketMessage` is
				// authoritative. Reserved for a future "acked" indicator.
			})
			.addCase(closeSocket, (state, action) => {
				const session = state.sessions[action.payload.socketId];
				if (!session) return;
				if (session.status === 'closed' || session.status === 'failed') return;
				session.status = 'closing';
				pushSystemMessage(session, 'Closing…', Date.now());
			})
			.addCase(socketClosing, (state, action) => {
				const session = state.sessions[action.payload.socketId];
				if (!session) return;
				if (session.status === 'closed' || session.status === 'failed') return;
				session.status = 'closing';
			})
			.addCase(socketClosed, (state, action) => {
				const { socketId, timestamp, code, reason, wasClean } = action.payload;
				const session = state.sessions[socketId];
				if (!session) return;
				session.status = 'closed';
				session.closedAt = timestamp;
				session.closeCode = code;
				session.closeReason = reason;
				session.wasClean = wasClean;
				pushSystemMessage(
					session,
					`Closed (${code}${reason ? ` – ${reason}` : ''})${wasClean ? '' : ' [unclean]'}`,
					timestamp,
				);
			})
			.addCase(socketFailed, (state, action) => {
				const { socketId, timestamp, message } = action.payload;
				const session = state.sessions[socketId];
				if (!session) return;
				session.status = 'failed';
				session.closedAt = timestamp;
				session.errorMessage = message;
				pushSystemMessage(session, `Failed: ${message}`, timestamp);
			})
			.addCase(clearSocket, (state, action) => {
				dropSession(state, action.payload.socketId);
			});
	},
});

function sizeOf(kind: 'text' | 'binary', data: string): number {
	if (kind === 'binary') {
		// base64 expansion: 4 chars per 3 bytes, minus padding.
		const trimmed = data.replace(/=+$/, '');
		return Math.floor((trimmed.length * 3) / 4);
	}
	return new TextEncoder().encode(data).length;
}

export default socketsSlice.reducer;

export const selectSocketSession = (socketId: string) => (state: { global: { sockets: SocketsSliceState } }) =>
	state.global.sockets.sessions[socketId] || null;

export const selectSocketsForRequest =
	(requestId: string) => (state: { global: { sockets: SocketsSliceState } }) => {
		const ids = state.global.sockets.socketsByRequest[requestId] ?? [];
		return ids.map(id => state.global.sockets.sessions[id]).filter(Boolean);
	};

/**
 * Most-recent socket session for a given request, or null. Mirrors
 * `selectActiveFlight` — the UI usually wants "the current one" without
 * thinking about concurrency.
 */
export const selectLatestSocketForRequest =
	(requestId: string) => (state: { global: { sockets: SocketsSliceState } }) => {
		const ids = state.global.sockets.socketsByRequest[requestId] ?? [];
		if (ids.length === 0) return null;
		return state.global.sockets.sessions[ids[ids.length - 1]] ?? null;
	};
