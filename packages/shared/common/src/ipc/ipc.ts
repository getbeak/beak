import type {
	IpcMain,
	IpcMainInvokeEvent,
	IpcRenderer,
	IpcRendererEvent,
} from 'electron';

import Squawk from '../utils/squawk';

export interface RequestPayload {
	code: string;
	payload: unknown;
}

export interface Response<T> {
	response?: T;
	error: Squawk;
}

export type IpcEvent = IpcMainInvokeEvent | IpcRendererEvent;
export type Listener<TP = any, TR = void | any> = (event: IpcEvent, payload: TP) => Promise<TR>;

export interface PartialIpcRenderer {
	on: (channel: string, listening: (event: IpcRendererEvent, ...args: any[]) => void) => void;
	invoke: IpcRenderer['invoke'];
}

export interface IpcMessage {
	code: string;
	payload: unknown;
}

class IpcServiceBase {
	protected channel: string;
	protected listeners: Record<string, Listener | undefined> = {};

	constructor(channel: string) {
		this.channel = channel;
	}

	getChannel() {
		return this.channel;
	}

	registerListener(eventCode: string, listener: Listener) {
		this.listeners[eventCode] = listener;
	}

	unregisterListener(eventCode: string) {
		this.listeners[eventCode] = void 0;
	}
}

export class IpcServiceRenderer extends IpcServiceBase {
	protected ipc: PartialIpcRenderer;

	constructor(channel: string, ipc: PartialIpcRenderer) {
		super(channel);

		this.ipc = ipc;
		this.register();
	}

	async invoke<T = void>(code: string, payload?: unknown) {
		const y = await this.ipc.invoke(this.channel, { code, payload });
		const { response, error } = y;

		if (error) {
			// eslint-disable-next-line no-console
			console.error(error);

			throw Squawk.coerce(error);
		}

		return response as T;
	}

	register() {
		this.ipc.on(this.channel, (event, message: IpcMessage) => {
			if (!message.code)
				throw new Error('Malformed ipc message');

			const listener = this.listeners[message.code];

			if (!listener) {
				// eslint-disable-next-line no-console
				console.warn(`renderer: no listener attached for event ${message.code}`, event, message.payload);

				return;
			}

			listener(event, message.payload);
		});
	}
}

export class IpcServiceMain extends IpcServiceBase {
	protected ipc: IpcMain;

	constructor(channel: string, ipc: IpcMain) {
		super(channel);

		this.ipc = ipc;
		this.register();
	}

	register() {
		this.ipc.handle(this.channel, async (event, message: IpcMessage) => {
			try {
				if (!message.code)
					throw new Error('Malformed ipc message');

				const listener = this.listeners[message.code];

				if (!listener) {
					// eslint-disable-next-line no-console
					console.warn(`main: no listener attached for event ${message.code}`, event, message.payload);

					throw new Error(`No listener attached for event '${message.code}'`);
				}

				const response = await listener(event, message.payload);

				return { response };
			} catch (error) {
				// TODO(afr): Yeah this is shit, can't be bothered to find out why I need it
				return { error: JSON.parse(JSON.stringify(Squawk.coerce(error))) };
			}
		});
	}
}
