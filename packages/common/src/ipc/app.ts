import {
	IpcMain,
	IpcRenderer,
} from 'electron';

import { AsyncListener, IpcServiceMain, IpcServiceRenderer } from './ipc';

const AppMessages = {
	GetVersion: 'get_version',
};

export class IpcAppServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: IpcRenderer) {
		super('app', ipc);
	}

	async getVersion(): Promise<string> {
		return this.ipc.invoke(this.channel, { code: AppMessages.GetVersion });
	}
}

export class IpcAppServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('app', ipc);
	}

	registerGetVersion(fn: AsyncListener<void, string>) {
		this.registerListener(AppMessages.GetVersion, fn);
	}
}
