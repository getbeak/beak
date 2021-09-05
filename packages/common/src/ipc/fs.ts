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
};

export interface FsBase {
	projectFilePath: string;
}

export interface ReadJsonReq extends FsBase {
	filePath: string;
	options?: ReadOptions;
}

export interface WriteJsonReq extends FsBase {
	filePath: string;
	content: any;
	options?: WriteOptions;
}

export interface ReadTextReq extends FsBase {
	filePath: string;
}

export interface WriteTextReq extends FsBase {
	filePath: string;
	content: string;
}

export interface SimplePath extends FsBase {
	filePath: string;
}

export interface MoveReq extends FsBase {
	srcPath: string;
	dstPath: string;
}

export interface ReadDirReq extends FsBase {
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

export class IpcFsServiceRenderer extends IpcServiceRenderer {
	private projectFilePath?: string;

	constructor(ipc: PartialIpcRenderer) {
		super('fs', ipc);
	}

	setProjectFilePath(projectFilePath: string) {
		this.projectFilePath = projectFilePath;
	}

	async readJson<T>(filePath: string, options?: ReadOptions) {
		return this.invoke<T>(FsMessages.ReadJson, {
			filePath,
			options,
			projectFilePath: this.projectFilePath,
		});
	}

	async writeJson(filePath: string, content: any, options?: WriteOptions) {
		return this.invoke(FsMessages.WriteJson, {
			filePath,
			content,
			options,
			projectFilePath: this.projectFilePath,
		});
	}

	async readText(filePath: string) {
		return this.invoke<string>(FsMessages.ReadText, {
			filePath,
			projectFilePath: this.projectFilePath,
		});
	}

	async writeText(filePath: string, content: string) {
		return this.invoke(FsMessages.WriteText, {
			filePath,
			content,
			projectFilePath: this.projectFilePath,
		});
	}

	async pathExists(filePath: string) {
		return this.invoke<boolean>(FsMessages.PathExists, {
			filePath,
			projectFilePath: this.projectFilePath,
		});
	}

	async ensureFile(filePath: string) {
		return this.invoke(FsMessages.EnsureFile, {
			filePath,
			projectFilePath: this.projectFilePath,
		});
	}

	async ensureDir(filePath: string) {
		return this.invoke(FsMessages.EnsureDir, {
			filePath,
			projectFilePath: this.projectFilePath,
		});
	}

	async remove(filePath: string) {
		return this.invoke(FsMessages.Remove, {
			filePath,
			projectFilePath: this.projectFilePath,
		});
	}

	async move(srcPath: string, dstPath: string) {
		return this.invoke(FsMessages.Move, {
			srcPath,
			dstPath,
			projectFilePath: this.projectFilePath,
		});
	}

	async readDir(filePath: string, options?: ReadDirReq['options']) {
		return this.invoke<DirectoryEntry[]>(FsMessages.ReadDir, {
			filePath,
			options,
			projectFilePath: this.projectFilePath,
		});
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
}
