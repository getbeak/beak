import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

const AppMessages = {
	GetVersion: 'get_version',
	GetPlatform: 'get_platform',
};

export class IpcAppServiceRenderer extends IpcServiceRenderer<'app'> {
	constructor(ipc: PartialIpcRenderer) {
		super('app', ipc);
	}

	async getVersion() {
		return this.invoke<string>(AppMessages.GetVersion);
	}

	async getPlatform() {
		return this.invoke<NodeJS.Platform>(AppMessages.GetPlatform);
	}
}

export class IpcAppServiceMain extends IpcServiceMain<'app'> {
	constructor(ipc: PartialIpcMain) {
		super('app', ipc);
	}

	registerGetVersion(fn: IpcListener<void>) {
		this.registerRequestHandler(AppMessages.GetVersion, fn);
	}

	registerGetPlatform(fn: IpcListener<void>) {
		this.registerRequestHandler(AppMessages.GetPlatform, fn);
	}
}
