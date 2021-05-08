import {
	IpcMain,
	IpcRenderer,
} from 'electron';

import { IpcServiceMain, IpcServiceRenderer, Listener } from './ipc';

export const ExplorerMessages = {
	RevealFile: 'reveal_file',
};

export class IpcExplorerServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: IpcRenderer) {
		super('explorer', ipc);
	}

	async revealFile(filePath: string) {
		return this.invoke(ExplorerMessages.RevealFile, filePath);
	}
}

export class IpcExplorerServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('explorer', ipc);
	}

	registerRevealFile(fn: Listener<string>) {
		this.registerListener(ExplorerMessages.RevealFile, fn);
	}
}
