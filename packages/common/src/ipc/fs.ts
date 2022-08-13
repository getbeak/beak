import type { IpcMain } from 'electron';
import { ReadOptions, WriteOptions } from 'fs-extra';

import { IpcServiceMain, IpcServiceRenderer, Listener, PartialIpcRenderer } from './ipc';

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
	options?: ReadOptions;
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
		encoding?: string | null;
		withFileTypes: true;
	};
}

export interface DirectoryEntry {
	name: string;
	isDirectory: boolean;
}

export interface OpenReferenceFileReq { }

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
}

export interface ReadReferencedFileRes {
	body: Uint8Array;
}

export class IpcFsServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: PartialIpcRenderer) {
		super('fs', ipc);
	}

	async readJson<T>(filePath: string, options?: ReadOptions) {
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

	async readReferencedFile(fileReferenceId: string) {
		return this.invoke<ReadReferencedFileRes>(FsMessages.ReadReferencedFile, { fileReferenceId });
	}
}

export class IpcFsServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('fs', ipc);
	}

	registerReadJson(fn: Listener<ReadJsonReq, any>) {
		this.registerListener(FsMessages.ReadJson, fn);
	}

	registerWriteJson(fn: Listener<WriteJsonReq>) {
		this.registerListener(FsMessages.WriteJson, fn);
	}

	registerReadText(fn: Listener<ReadTextReq, any>) {
		this.registerListener(FsMessages.ReadText, fn);
	}

	registerWriteText(fn: Listener<WriteTextReq>) {
		this.registerListener(FsMessages.WriteText, fn);
	}

	registerPathExists(fn: Listener<SimplePath, boolean>) {
		this.registerListener(FsMessages.PathExists, fn);
	}

	registerEnsureFile(fn: Listener<SimplePath>) {
		this.registerListener(FsMessages.EnsureFile, fn);
	}

	registerEnsureDir(fn: Listener<SimplePath>) {
		this.registerListener(FsMessages.EnsureDir, fn);
	}

	registerRemove(fn: Listener<SimplePath>) {
		this.registerListener(FsMessages.Remove, fn);
	}

	registerMove(fn: Listener<MoveReq>) {
		this.registerListener(FsMessages.Move, fn);
	}

	registerReadDir(fn: Listener<ReadDirReq, DirectoryEntry[]>) {
		this.registerListener(FsMessages.ReadDir, fn);
	}

	registerOpenReferenceFile(fn: Listener<OpenReferenceFileReq, OpenReferenceFileRes | null>) {
		this.registerListener(FsMessages.OpenReferenceFile, fn);
	}

	registerPreviewReferencedFile(fn: Listener<PreviewReferencedFileReq, PreviewReferencedFileRes | null>) {
		this.registerListener(FsMessages.PreviewReferencedFile, fn);
	}

	registerReadReferencedFile(fn: Listener<ReadReferencedFileReq, ReadReferencedFileRes>) {
		this.registerListener(FsMessages.ReadReferencedFile, fn);
	}
}
