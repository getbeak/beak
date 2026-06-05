import { z } from 'zod';

import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

/**
 * Values IPC — read/write the per-project `.beak/values.json` file that
 * holds the concrete values filling in each request's schema. The host
 * does not validate the document shape; the renderer re-parses with Zod
 * (`projectValuesFileSchema`) so a corrupt file falls back to empty state
 * rather than crashing the slice.
 */

const saveSchema = z.object({
	/** JSON-serializable document conforming to `projectValuesFileSchema`. */
	values: z.unknown(),
});

export const ValuesMessages = {
	Load: 'load',
	Save: 'save',
} as const;

export interface LoadValuesRes {
	/** Parsed JSON contents, or `null` when the file is absent / unparsable. */
	values: unknown | null;
}

export interface SaveValuesReq {
	values: unknown;
}

export class IpcValuesServiceRenderer extends IpcServiceRenderer<'values'> {
	constructor(ipc: PartialIpcRenderer) {
		super('values', ipc);
	}

	async load() {
		return this.invoke<LoadValuesRes>(ValuesMessages.Load);
	}

	async save(payload: SaveValuesReq) {
		return this.invoke(ValuesMessages.Save, payload);
	}
}

export class IpcValuesServiceMain extends IpcServiceMain<'values'> {
	constructor(ipc: PartialIpcMain) {
		super('values', ipc);
	}

	registerLoad(fn: IpcListener<void>) {
		this.registerRequestHandler(ValuesMessages.Load, fn);
	}

	registerSave(fn: IpcListener<SaveValuesReq>) {
		this.registerRequestHandler(ValuesMessages.Save, fn, saveSchema as never);
	}
}
