import type { WebContents } from 'electron';

import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

/**
 * IPC channel for per-flight streaming bodies. The renderer owns the
 * producer (`ReadableStream<Uint8Array>`); the requester (main / agent)
 * pulls chunks on demand.
 *
 * Why this isn't a single bidirectional MessagePort: Electron's
 * `IpcServiceRenderer` already serialises round-trips through the
 * existing IPC layer, and a per-flight MessagePort needs lifecycle
 * management (transfer-on-start, dispose-on-end) the existing layer
 * doesn't model. The Pull / PullResponse pair mirrors the
 * `parseValueSections` callback pattern in `extensions.ts` —
 * proven and easy to reason about, at the cost of one round-trip
 * per chunk.
 *
 * Wire shape:
 *   Pull        : main → renderer   { streamId, requestId, byteHint }
 *   PullResponse: renderer → main   { streamId, requestId, chunk?, done }
 *   Cancel      : main → renderer   { streamId }
 *
 * Backpressure: the requester sends one `Pull` and waits for the
 * `PullResponse` before sending the next. `byteHint` is advisory —
 * the renderer can ship more or less.
 */
export const StreamsMessages = {
	Pull: 'pull',
	PullResponse: 'pull_response',
	Cancel: 'cancel',
} as const;

export interface PullPayload {
	streamId: string;
	requestId: string;
	byteHint: number;
}

export interface PullResponsePayload {
	streamId: string;
	requestId: string;
	chunk?: Uint8Array;
	done: boolean;
	error?: string;
}

export interface CancelPayload {
	streamId: string;
}

export class IpcStreamServiceRenderer extends IpcServiceRenderer<'streams'> {
	constructor(ipc: PartialIpcRenderer) {
		super('streams', ipc);
	}

	/**
	 * Subscribe to `Pull` requests from the host. The renderer-side
	 * `StreamRegistry` registers a handler that reads from its source
	 * stream and replies with `respondPull`.
	 */
	registerPull(fn: IpcListener<PullPayload>) {
		this.registerListener(StreamsMessages.Pull, fn);
	}

	respondPull(payload: PullResponsePayload) {
		// We invoke (request/response shape) instead of a one-way send
		// because the host correlates request-id; a one-way message-send
		// without a return acknowledgement would race with the next pull.
		return this.invoke<void>(StreamsMessages.PullResponse, payload);
	}

	registerCancel(fn: IpcListener<CancelPayload>) {
		this.registerListener(StreamsMessages.Cancel, fn);
	}
}

export class IpcStreamServiceMain extends IpcServiceMain<'streams'> {
	constructor(ipc: PartialIpcMain) {
		super('streams', ipc);
	}

	pull(wc: WebContents, payload: PullPayload) {
		this.sendMessage(wc, StreamsMessages.Pull, payload);
	}

	registerPullResponse(fn: IpcListener<PullResponsePayload>) {
		this.registerRequestHandler(StreamsMessages.PullResponse, fn);
	}

	cancel(wc: WebContents, payload: CancelPayload) {
		this.sendMessage(wc, StreamsMessages.Cancel, payload);
	}
}
