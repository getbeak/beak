import type { IpcMainInvokeEvent, WebContents } from 'electron';

import { IpcServiceBase } from './base';
import type { IpcError, IpcListener, IpcMessage, IpcSchema } from './types';

export class IpcServiceMain<T extends string> extends IpcServiceBase<T> {
	constructor(
		channel: T,
		protected readonly ipc: PartialIpcMain,
	) {
		super(channel);
		this.setupRequestHandling();
	}

	/**
	 * Register a request handler. If a `schema` is supplied, incoming payloads
	 * are parsed through it before reaching the handler; invalid payloads throw
	 * and the IPC handler middleware turns the throw into an `IpcError` response.
	 */
	protected registerRequestHandler<P = unknown>(
		messageType: string,
		handler: IpcListener<P>,
		schema?: IpcSchema<P>,
	): void {
		const wrapped: IpcListener = schema
			? (event, payload) => handler(event, schema.parse(payload))
			: (handler as IpcListener);
		this.requestHandlers.set(messageType, wrapped);
	}

	protected sendMessage(webContents: WebContents, messageType: string, payload: unknown): void {
		webContents.send(this.channel, {
			code: messageType,
			payload,
			timestamp: Date.now(),
		});
	}

	private setupRequestHandling(): void {
		this.ipc.handle(this.channel, async (event, message: IpcMessage) => {
			try {
				if (!message || !message.code) {
					throw new Error('Malformed IPC message');
				}

				const handler = this.requestHandlers.get(message.code);
				if (!handler) {
					throw new Error(`No handler for message: ${message.code}`);
				}

				const result = await handler(event, message.payload);
				return { response: result };
			} catch (error) {
				console.error(`IPC Error in ${this.channel}:`, error);
				return { error: this.normalizeError(error) };
			}
		});
	}

	private normalizeError(error: unknown): IpcError {
		if (error instanceof Error) {
			// Preserve the original `.code` when the thrower set one (e.g. node fs
			// errors like ENOENT, ENOTDIR, EACCES). Renderer-side effects branch
			// on these — overwriting them with a generic 'IPC_ERROR' forces
			// callers to brittle-string-match the message instead.
			const original = (error as Error & { code?: unknown }).code;
			const code = typeof original === 'string' && original.length > 0 ? original : 'IPC_ERROR';
			return {
				code,
				message: error.message,
				stack: error.stack,
			};
		}
		if (typeof error === 'string') {
			return {
				code: 'UNKNOWN_ERROR',
				message: error,
			};
		}
		return {
			code: 'UNKNOWN_ERROR',
			message: 'Unknown error occurred',
			details: error,
		};
	}
}

export interface PartialIpcMain {
	handle: (channel: string, listener: IpcMainListener) => void;
}

export type IpcMainListener = (event: IpcMainInvokeEvent, payload: IpcMessage) => Promise<Response<unknown>>;

export interface Response<T> {
	response?: T;
	error?: IpcError;
}
