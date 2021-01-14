import {
	IpcMain,
	IpcMainInvokeEvent,
	IpcRenderer,
	IpcRendererEvent,
} from 'electron';

export type AsyncListener<T = any | void, T2 = any | void> = (event: IpcMainInvokeEvent, payload: T) => Promise<T2>;
export type SyncListener<T = any | void> = (event: IpcRendererEvent, payload: T) => void;

type Listener = AsyncListener | SyncListener;

export interface IpcMessage {
	code: string;
	payload: unknown;
}

class IpcServiceBase {
	protected channel: string;
	protected listeners: Record<string, Listener[]> = {};

	constructor(channel: string) {
		this.channel = channel;
	}

	registerListener(eventType: string, listener: Listener) {
		if (!this.listeners[eventType])
			this.listeners[eventType] = [];

		this.listeners[eventType].push(listener);
	}
}

export class IpcServiceRenderer extends IpcServiceBase {
	protected ipc: IpcRenderer;

	constructor(channel: string, ipc: IpcRenderer) {
		super(channel);

		this.ipc = ipc;

		this.register();
	}

	register() {
		this.ipc.on(this.channel, (event, message: IpcMessage) => {
			if (!message.code)
				throw new Error('Malformed ipc message');

			const listeners = this.listeners[message.code] as SyncListener[];

			if (!listeners || listeners.length === 0)
				throw new Error(`No listener attached for ${message.code}`);

			listeners.map(l => l(event, message.payload));
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
			if (!message.code)
				throw new Error('Malformed ipc message');

			const listeners = this.listeners[message.code] as AsyncListener[];

			if (!listeners || listeners.length === 0)
				throw new Error(`No listeners attached for ${message.code}`);

			const results = await Promise.all(listeners.map(l => l(event, message.payload)));
			const result = results.filter(Boolean)[0];

			return result;
		});
	}
}
