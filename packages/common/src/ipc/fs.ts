import type { WriteOptions } from 'fs-extra';
import type { JFReadOptions } from 'jsonfile';
import { z } from 'zod';
import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

// Inbound payload schemas. These guard the renderer→main boundary; main is
// trusted but the renderer can be running extension code that produces
// malformed payloads. Paths in particular are sensitive — we validate them
// as non-empty strings here; the consuming handlers do further sandboxing
// (ensureWithinProject etc.) so this catches wire-protocol errors, not
// path-traversal attempts.
const simplePathSchema = z.object({ filePath: z.string().min(1) });
const readJsonSchema = simplePathSchema.extend({ options: z.unknown().optional() });
const writeJsonSchema = simplePathSchema.extend({
	content: z.unknown(),
	options: z.unknown().optional(),
});
const writeTextSchema = simplePathSchema.extend({ content: z.string() });
const moveSchema = z.object({
	srcPath: z.string().min(1),
	dstPath: z.string().min(1),
});
const readDirSchema = simplePathSchema.extend({
	options: z.object({ withFileTypes: z.literal(true) }).optional(),
});
const fileReferenceSchema = z.object({
	fileReferenceId: z.string().min(1),
	truncatedLength: z.number().int().nonnegative().optional(),
});

export const FsMessages = {
	ReadDir: 'read_dir',
	ReadJson: 'read_json',
	WriteJson: 'write_json',
	ReadText: 'read_text',
	WriteText: 'write_text',
	PathExists: 'path_exists',
	EnsureFile: 'ensure_file',
	Remove: 'remove',
	EnsureDir: 'ensure_dir',
	Move: 'move',
	OpenReferenceFile: 'open_reference_file',
	PreviewReferencedFile: 'preview_referenced_file',
	ReadReferencedFile: 'read_referenced_file',
};

export interface ReadJsonReq {
	filePath: string;
	options?: JFReadOptions;
}

export interface WriteJsonReq {
	filePath: string;
	content: unknown;
	options?: WriteOptions;
}

export interface ReadTextReq {
	filePath: string;
}

export interface WriteTextReq {
	filePath: string;
	content: string;
}

export interface SimplePath {
	filePath: string;
}

export interface MoveReq {
	srcPath: string;
	dstPath: string;
}

export interface ReadDirReq {
	filePath: string;
	options: {
		withFileTypes: true;
	};
}

export interface DirectoryEntry {
	name: string;
	isDirectory: boolean;
}

export type OpenReferenceFileReq = {};

export interface OpenReferenceFileRes {
	fileReferenceId: string;
}

export interface PreviewReferencedFileReq {
	fileReferenceId: string;
}

export interface PreviewReferencedFileRes {
	fileName: string;
	filePath: string;
	fileSize: number;
	fileExtension: string;
}

export interface ReadReferencedFileReq {
	fileReferenceId: string;
	truncatedLength?: number;
}

export interface ReadReferencedFileRes {
	body: Uint8Array;
}

export class IpcFsServiceRenderer extends IpcServiceRenderer<'fs'> {
	constructor(ipc: PartialIpcRenderer) {
		super('fs', ipc);
	}

	async readJson<T>(filePath: string, options?: JFReadOptions) {
		return this.invoke<T>(FsMessages.ReadJson, { filePath, options });
	}

	async writeJson(filePath: string, content: unknown, options?: WriteOptions) {
		return this.invoke(FsMessages.WriteJson, { filePath, content, options });
	}

	async readText(filePath: string) {
		return this.invoke<string>(FsMessages.ReadText, { filePath });
	}

	async writeText(filePath: string, content: string) {
		return this.invoke(FsMessages.WriteText, { filePath, content });
	}

	async pathExists(filePath: string) {
		return this.invoke<boolean>(FsMessages.PathExists, { filePath });
	}

	async ensureFile(filePath: string) {
		return this.invoke(FsMessages.EnsureFile, { filePath });
	}

	async ensureDir(filePath: string) {
		return this.invoke(FsMessages.EnsureDir, { filePath });
	}

	async remove(filePath: string) {
		return this.invoke(FsMessages.Remove, { filePath });
	}

	async move(srcPath: string, dstPath: string) {
		return this.invoke(FsMessages.Move, { srcPath, dstPath });
	}

	async readDir(filePath: string, options?: ReadDirReq['options']) {
		return this.invoke<DirectoryEntry[]>(FsMessages.ReadDir, { filePath, options });
	}

	async openReferenceFile() {
		return this.invoke<OpenReferenceFileRes | null>(FsMessages.OpenReferenceFile);
	}

	async previewReferencedFile(fileReferenceId: string) {
		return this.invoke<PreviewReferencedFileRes | null>(FsMessages.PreviewReferencedFile, { fileReferenceId });
	}

	async readReferencedFile(fileReferenceId: string, truncatedLength?: number) {
		return this.invoke<ReadReferencedFileRes>(FsMessages.ReadReferencedFile, { fileReferenceId, truncatedLength });
	}
}

export class IpcFsServiceMain extends IpcServiceMain<'fs'> {
	constructor(ipc: PartialIpcMain) {
		super('fs', ipc);
	}

	registerReadJson(fn: IpcListener<ReadJsonReq>) {
		this.registerRequestHandler(FsMessages.ReadJson, fn, readJsonSchema as never);
	}

	registerWriteJson(fn: IpcListener<WriteJsonReq>) {
		this.registerRequestHandler(FsMessages.WriteJson, fn, writeJsonSchema as never);
	}

	registerReadText(fn: IpcListener<ReadTextReq>) {
		this.registerRequestHandler(FsMessages.ReadText, fn, simplePathSchema as never);
	}

	registerWriteText(fn: IpcListener<WriteTextReq>) {
		this.registerRequestHandler(FsMessages.WriteText, fn, writeTextSchema as never);
	}

	registerPathExists(fn: IpcListener<SimplePath>) {
		this.registerRequestHandler(FsMessages.PathExists, fn, simplePathSchema as never);
	}

	registerEnsureFile(fn: IpcListener<SimplePath>) {
		this.registerRequestHandler(FsMessages.EnsureFile, fn, simplePathSchema as never);
	}

	registerEnsureDir(fn: IpcListener<SimplePath>) {
		this.registerRequestHandler(FsMessages.EnsureDir, fn, simplePathSchema as never);
	}

	registerRemove(fn: IpcListener<SimplePath>) {
		this.registerRequestHandler(FsMessages.Remove, fn, simplePathSchema as never);
	}

	registerMove(fn: IpcListener<MoveReq>) {
		this.registerRequestHandler(FsMessages.Move, fn, moveSchema as never);
	}

	registerReadDir(fn: IpcListener<ReadDirReq>) {
		this.registerRequestHandler(FsMessages.ReadDir, fn, readDirSchema as never);
	}

	registerOpenReferenceFile(fn: IpcListener<OpenReferenceFileReq>) {
		this.registerRequestHandler(FsMessages.OpenReferenceFile, fn);
	}

	registerPreviewReferencedFile(fn: IpcListener<PreviewReferencedFileReq>) {
		this.registerRequestHandler(FsMessages.PreviewReferencedFile, fn, fileReferenceSchema as never);
	}

	registerReadReferencedFile(fn: IpcListener<ReadReferencedFileReq>) {
		this.registerRequestHandler(FsMessages.ReadReferencedFile, fn, fileReferenceSchema as never);
	}
}
