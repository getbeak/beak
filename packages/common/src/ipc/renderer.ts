import type { IpcRenderer, IpcRendererEvent } from 'electron';

import { IpcServiceBase } from './base';
import type { IpcMessage } from './types';

export class IpcServiceRenderer<T extends string> extends IpcServiceBase<T> {
	constructor(
		channel: T,
		protected readonly ipc: PartialIpcRenderer,
	) {
		super(channel);
		this.setupMessageHandling();
	}

	protected async invoke<R = void>(code: string, payload?: unknown): Promise<R> {
		try {
			const response = await this.ipc.invoke(this.channel, { code, payload });

			if (response && typeof response === 'object' && 'error' in response && response.error) {
				throw new Error(`IPC Error: ${JSON.stringify(response.error)}`);
			}

			return (response as any)?.response as R;
		} catch (error) {
			throw this.normalizeError(error);
		}
	}

	private setupMessageHandling(): void {
		this.ipc.on(this.channel, (event, message: IpcMessage) => {
			if (!message || !message.code) {
				// eslint-disable-next-line no-console
				console.warn('Malformed IPC message received:', message);
				return;
			}

			const listener = this.listeners.get(message.code);
			if (listener) {
				listener(event, message.payload);
			} else {
				// eslint-disable-next-line no-console
				console.warn(`No listener for message: ${message.code}`);
			}
		});
	}

	private normalizeError(error: unknown): Error {
		if (error instanceof Error) return error;
		if (typeof error === 'string') return new Error(error);
		return new Error('Unknown IPC error');
	}
}

export interface PartialIpcRenderer {
	on: (channel: string, listening: (event: IpcRendererEvent, ...args: any[]) => void) => void;
	invoke: IpcRenderer['invoke'];
}
