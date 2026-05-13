export type IpcChannel =
	| 'flight'
	| 'fs'
	| 'project'
	| 'preferences'
	| 'extensions'
	| 'nest'
	| 'encryption'
	| 'notification'
	| 'window'
	| 'dialog'
	| 'explorer'
	| 'beak-hub'
	| 'context-menu'
	| 'fs-watcher'
	| 'openapi';

export interface IpcMessage<T = unknown> {
	code: string;
	payload: T;
	requestId?: string;
	timestamp?: number;
}

export type IpcResponse<T = unknown> =
	| { success: true; data: T; requestId?: string }
	| { success: false; error: IpcError; requestId?: string };

export interface IpcError {
	code: string;
	message: string;
	details?: unknown;
	stack?: string;
}

// The wrapping IPC layer (main.ts) awaits the listener's return value and
// returns it as the response, so listeners that produce data (request handlers)
// and listeners that don't (fire-and-forget events) share one type.
export type IpcListener<T = unknown> = (event: any, payload: T) => Promise<unknown> | unknown;

/**
 * Minimum contract for an IPC payload validator. Structurally compatible with
 * a zod `ZodType` (call `.parse(input)`), but the IPC layer doesn't hard-depend
 * on zod — any value with a `parse(input: unknown): T` method works.
 *
 * Schemas throw when validation fails; the IPC main-process handler catches
 * the throw and returns it as a normal `IpcError` to the caller.
 */
export interface IpcSchema<T> {
	parse(input: unknown): T;
}
