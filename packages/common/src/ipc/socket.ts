import type { WebContents } from 'electron';
import { z } from 'zod';

import type {
	CloseSocketRequest,
	OpenSocketRequest,
	SendSocketMessageRequest,
	SocketClosedPayload,
	SocketFailedPayload,
	SocketMessageInPayload,
	SocketOpenedPayload,
} from '../types/socket';
import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

export const SocketMessages = {
	Open: 'socket_open',
	Send: 'socket_send',
	Close: 'socket_close',
	Opened: 'socket_opened',
	MessageIn: 'socket_message_in',
	Closed: 'socket_closed',
	Failed: 'socket_failed',
} as const;

export type SocketMessageType = (typeof SocketMessages)[keyof typeof SocketMessages];

const OpenSocketSchema = z.object({
	socketId: z.string().min(1),
	requestId: z.string().min(1),
	url: z.string().min(1),
	protocols: z.array(z.string()).optional(),
	headers: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
});

const SendSocketSchema = z.object({
	socketId: z.string().min(1),
	kind: z.union([z.literal('text'), z.literal('binary')]),
	data: z.string(),
});

const CloseSocketSchema = z.object({
	socketId: z.string().min(1),
	code: z.number().int().optional(),
	reason: z.string().optional(),
});

export class IpcSocketServiceRenderer extends IpcServiceRenderer<'socket'> {
	constructor(ipc: PartialIpcRenderer) {
		super('socket', ipc);
	}

	async open(payload: OpenSocketRequest) {
		return this.invoke(SocketMessages.Open, payload);
	}

	async send(payload: SendSocketMessageRequest) {
		return this.invoke(SocketMessages.Send, payload);
	}

	async close(payload: CloseSocketRequest) {
		return this.invoke(SocketMessages.Close, payload);
	}

	registerOpened(fn: IpcListener<SocketOpenedPayload>) {
		this.registerListener(SocketMessages.Opened, fn);
	}

	registerMessage(fn: IpcListener<SocketMessageInPayload>) {
		this.registerListener(SocketMessages.MessageIn, fn);
	}

	registerClosed(fn: IpcListener<SocketClosedPayload>) {
		this.registerListener(SocketMessages.Closed, fn);
	}

	registerFailed(fn: IpcListener<SocketFailedPayload>) {
		this.registerListener(SocketMessages.Failed, fn);
	}
}

export class IpcSocketServiceMain extends IpcServiceMain<'socket'> {
	constructor(ipc: PartialIpcMain) {
		super('socket', ipc);
	}

	registerOpen(fn: IpcListener<OpenSocketRequest>) {
		this.registerRequestHandler(SocketMessages.Open, fn, OpenSocketSchema as never);
	}

	registerSend(fn: IpcListener<SendSocketMessageRequest>) {
		this.registerRequestHandler(SocketMessages.Send, fn, SendSocketSchema as never);
	}

	registerClose(fn: IpcListener<CloseSocketRequest>) {
		this.registerRequestHandler(SocketMessages.Close, fn, CloseSocketSchema as never);
	}

	sendOpened(wc: WebContents, payload: SocketOpenedPayload) {
		this.sendMessage(wc, SocketMessages.Opened, payload);
	}

	sendMessageIn(wc: WebContents, payload: SocketMessageInPayload) {
		this.sendMessage(wc, SocketMessages.MessageIn, payload);
	}

	sendClosed(wc: WebContents, payload: SocketClosedPayload) {
		this.sendMessage(wc, SocketMessages.Closed, payload);
	}

	sendFailed(wc: WebContents, payload: SocketFailedPayload) {
		this.sendMessage(wc, SocketMessages.Failed, payload);
	}
}
