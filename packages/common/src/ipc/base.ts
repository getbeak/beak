import type { IpcListener, IpcSchema } from './types';

export abstract class IpcServiceBase<T extends string> {
	protected readonly channel: T;
	protected readonly listeners = new Map<string, IpcListener>();
	protected readonly requestHandlers = new Map<string, IpcListener>();

	constructor(channel: T) {
		this.channel = channel;
	}

	/**
	 * Register an event listener. If a `schema` is supplied, incoming payloads
	 * are parsed through it before reaching the handler — invalid payloads
	 * throw and the listener is not called.
	 */
	protected registerListener<P = unknown>(messageType: string, listener: IpcListener<P>, schema?: IpcSchema<P>): void {
		const wrapped: IpcListener = schema
			? (event, payload) => listener(event, schema.parse(payload))
			: (listener as IpcListener);
		this.listeners.set(messageType, wrapped);
	}

	protected unregisterListener(messageType: string): void {
		this.listeners.delete(messageType);
	}

	protected getChannel(): T {
		return this.channel;
	}

	protected hasListener(messageType: string): boolean {
		return this.listeners.has(messageType);
	}

	protected getListenerCount(): number {
		return this.listeners.size;
	}

	protected clearAllListeners(): void {
		this.listeners.clear();
	}
}
