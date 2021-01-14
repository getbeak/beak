import {
	IpcMain,
	IpcRenderer,
} from 'electron';

import { AsyncListener, IpcServiceMain, IpcServiceRenderer } from './ipc';

export class IpcExplorerServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: IpcRenderer) {
		super('explorer', ipc);
	}

	async revealFile(filePath: string) {
		return this.ipc.invoke(this.channel, {
			code: 'reveal_file',
			payload: filePath,
		});
	}
}

export class IpcExplorerServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('explorer', ipc);
	}

	registerRevealFile(fn: AsyncListener<string>) {
		this.registerListener('reveal_file', fn);
	}
}
