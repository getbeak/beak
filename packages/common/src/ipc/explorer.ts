import type { IpcMain } from 'electron';

import { IpcServiceMain, IpcServiceRenderer, Listener, PartialIpcRenderer } from './ipc';

export const ExplorerMessages = {
	RevealFile: 'reveal_file',
	LaunchUrl: 'launch_url',
};

export class IpcExplorerServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: PartialIpcRenderer) {
		super('explorer', ipc);
	}

	async revealFile(filePath: string) {
		return this.invoke(ExplorerMessages.RevealFile, filePath);
	}

	async launchUrl(url: string) {
		return this.invoke(ExplorerMessages.LaunchUrl, url);
	}
}

export class IpcExplorerServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('explorer', ipc);
	}

	registerRevealFile(fn: Listener<string>) {
		this.registerListener(ExplorerMessages.RevealFile, fn);
	}

	registerLaunchUrl(fn: Listener<string>) {
		this.registerListener(ExplorerMessages.LaunchUrl, fn);
	}
}
