import type { IpcMain } from 'electron';

import { IpcServiceMain, IpcServiceRenderer, Listener, PartialIpcRenderer } from './ipc';

export const ExplorerMessages = {
	RevealFile: 'reveal_file',
	CopyFullNodePath: 'copy_full_node_path',
	LaunchUrl: 'launch_url',
};

export class IpcExplorerServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: PartialIpcRenderer) {
		super('explorer', ipc);
	}

	async revealFile(filePath: string) {
		return this.invoke(ExplorerMessages.RevealFile, filePath);
	}

	async copyFullNodePath(filePath: string) {
		return this.invoke(ExplorerMessages.CopyFullNodePath, filePath);
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

	registerCopyFullNodePath(fn: Listener<string>) {
		this.registerListener(ExplorerMessages.CopyFullNodePath, fn);
	}

	registerLaunchUrl(fn: Listener<string>) {
		this.registerListener(ExplorerMessages.LaunchUrl, fn);
	}
}
