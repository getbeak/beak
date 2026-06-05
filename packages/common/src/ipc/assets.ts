import { z } from 'zod';

import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

/**
 * Asset IPC — content-addressed binary blob storage under the project's
 * `_assets/` directory. The renderer sends raw bytes (Uint8Array passes
 * through Electron's structured-clone IPC) plus an optional contentType;
 * the host computes the sha256 and persists.
 *
 * Reads are also supported so the renderer can preview an asset (e.g.,
 * an image referenced by a request body) without re-uploading it.
 */
const writeSchema = z.object({
	bytes: z.instanceof(Uint8Array),
	contentType: z.string().min(1).optional(),
});

const refSchema = z.object({
	sha256: z.string().regex(/^[0-9a-f]{64}$/),
	size: z.number().int().nonnegative(),
	contentType: z.string().optional(),
});

const readSchema = z.object({
	ref: refSchema,
});

export const AssetsMessages = {
	Write: 'write',
	Read: 'read',
	Exists: 'exists',
} as const;

export interface AssetRefDto {
	sha256: string;
	size: number;
	contentType?: string;
}

export interface WriteAssetReq {
	bytes: Uint8Array;
	contentType?: string;
}

export interface WriteAssetRes {
	ref: AssetRefDto;
	relativePath: string;
}

export interface ReadAssetReq {
	ref: AssetRefDto;
}

export interface ReadAssetRes {
	bytes: Uint8Array | null;
}

export interface ExistsAssetReq {
	ref: AssetRefDto;
}

export interface ExistsAssetRes {
	exists: boolean;
}

export class IpcAssetsServiceRenderer extends IpcServiceRenderer<'assets'> {
	constructor(ipc: PartialIpcRenderer) {
		super('assets', ipc);
	}

	async write(payload: WriteAssetReq) {
		return this.invoke<WriteAssetRes>(AssetsMessages.Write, payload);
	}

	async read(payload: ReadAssetReq) {
		return this.invoke<ReadAssetRes>(AssetsMessages.Read, payload);
	}

	async exists(payload: ExistsAssetReq) {
		return this.invoke<ExistsAssetRes>(AssetsMessages.Exists, payload);
	}
}

export class IpcAssetsServiceMain extends IpcServiceMain<'assets'> {
	constructor(ipc: PartialIpcMain) {
		super('assets', ipc);
	}

	registerWrite(fn: IpcListener<WriteAssetReq>) {
		this.registerRequestHandler(AssetsMessages.Write, fn, writeSchema as never);
	}

	registerRead(fn: IpcListener<ReadAssetReq>) {
		this.registerRequestHandler(AssetsMessages.Read, fn, readSchema as never);
	}

	registerExists(fn: IpcListener<ExistsAssetReq>) {
		this.registerRequestHandler(AssetsMessages.Exists, fn, readSchema as never);
	}
}
