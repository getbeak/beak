import { z } from 'zod';

import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

/**
 * Boundary schema for the OpenAPI sync request. The spec itself is passed
 * pre-parsed as an unknown object so the converter (which lives in
 * `@beak/state/sources/openapi`) can run on the host side and write straight
 * to disk without the renderer needing to know about the file layout.
 *
 * `targetFolder` is project-relative — the host joins it onto the project
 * root before writing. The handler is responsible for sandboxing the join
 * (`ensureWithinProject`-style) so a hostile renderer cannot escape the
 * project root.
 */
const syncFromSpecSchema = z.object({
	targetFolder: z.string().min(1),
	spec: z.unknown(),
	seedMode: z.enum(['url', 'file', 'paste']).optional(),
	specPath: z.string().min(1).optional(),
	specUrl: z.url().optional(),
	autoSync: z.boolean().optional(),
	intervalMinutes: z.number().int().min(1).optional(),
	groupByPath: z.boolean().optional(),
});

/**
 * Boundary schema for the OpenAPI export request. The folder is
 * project-relative and gets sandboxed against the project root before the
 * reader walks it. Title / version / description seed the document's `info`
 * block; `variableSetName` lets the host resolve the collection's
 * `variable_set_item` baseUrl back into one server per set.
 */
const exportFromFolderSchema = z.object({
	folder: z.string().min(1),
	title: z.string().min(1).optional(),
	version: z.string().min(1).optional(),
	description: z.string().optional(),
	variableSetName: z.string().min(1).optional(),
});

export const OpenApiMessages = {
	SyncFromSpec: 'sync_from_spec',
	ExportFromFolder: 'export_from_folder',
} as const;

export interface SyncFromSpecReq {
	/** Project-relative folder where the collection + request files land. */
	targetFolder: string;
	/** Pre-parsed OpenAPI document — the host runs the converter on it. */
	spec: unknown;
	/** Which add-mode produced this sync — determines the re-sync UX surface. */
	seedMode?: 'url' | 'file' | 'paste';
	/** Optional reference for where the spec was loaded from (logged into the collection). */
	specPath?: string;
	specUrl?: string;
	/** Persist autoSync flag onto the collection's source. */
	autoSync?: boolean;
	/** Persist intervalMinutes onto the collection's source. */
	intervalMinutes?: number;
	/** Group requests into sub-folders derived from each operation's URL path. */
	groupByPath?: boolean;
}

export interface SyncFromSpecRes {
	collectionPath: string;
	requestPaths: string[];
	overwritten: string[];
	skipped: Array<{ path: string; reason: string }>;
	warnings: string[];
}

export interface ExportFromFolderReq {
	/** Project-relative folder whose collection + requests get exported. */
	folder: string;
	/** OpenAPI `info.title`. Defaults to the folder name when omitted. */
	title?: string;
	/** OpenAPI `info.version`. Defaults to `1.0.0`. */
	version?: string;
	/** OpenAPI `info.description`. Free text. */
	description?: string;
	/**
	 * Name of the variable set to consult when the collection's baseUrl points
	 * at a `variable_set_item`. Defaults to `Environments` — what the
	 * importer uses by default. Omitting it means the host won't enumerate
	 * sets and the exported document carries no servers.
	 */
	variableSetName?: string;
}

export interface ExportFromFolderRes {
	/**
	 * The exported OpenAPI 3 document. Returned as `unknown` because the IPC
	 * boundary can't reach the structural OpenAPI type without dragging
	 * @beak/state into @beak/common. Callers cast on receipt; the renderer's
	 * dialog stringifies it directly.
	 */
	document: unknown;
	warnings: string[];
	/** Files the host walked but couldn't parse — surfaced for diagnostics. */
	skipped: Array<{ path: string; reason: string }>;
}

export class IpcOpenApiServiceRenderer extends IpcServiceRenderer<'openapi'> {
	constructor(ipc: PartialIpcRenderer) {
		super('openapi', ipc);
	}

	async syncFromSpec(payload: SyncFromSpecReq) {
		return this.invoke<SyncFromSpecRes>(OpenApiMessages.SyncFromSpec, payload);
	}

	async exportFromFolder(payload: ExportFromFolderReq) {
		return this.invoke<ExportFromFolderRes>(OpenApiMessages.ExportFromFolder, payload);
	}
}

export class IpcOpenApiServiceMain extends IpcServiceMain<'openapi'> {
	constructor(ipc: PartialIpcMain) {
		super('openapi', ipc);
	}

	registerSyncFromSpec(fn: IpcListener<SyncFromSpecReq>) {
		this.registerRequestHandler(OpenApiMessages.SyncFromSpec, fn, syncFromSpecSchema as never);
	}

	registerExportFromFolder(fn: IpcListener<ExportFromFolderReq>) {
		this.registerRequestHandler(OpenApiMessages.ExportFromFolder, fn, exportFromFolderSchema as never);
	}
}
