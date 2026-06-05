import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

export const ExplorerMessages = {
	RevealFile: 'reveal_file',
	CopyFullNodePath: 'copy_full_node_path',
	LaunchUrl: 'launch_url',
};

export class IpcExplorerServiceRenderer extends IpcServiceRenderer<'explorer'> {
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

export class IpcExplorerServiceMain extends IpcServiceMain<'explorer'> {
	constructor(ipc: PartialIpcMain) {
		super('explorer', ipc);
	}

	registerRevealFile(fn: IpcListener<string>) {
		this.registerRequestHandler(ExplorerMessages.RevealFile, fn);
	}

	registerCopyFullNodePath(fn: IpcListener<string>) {
		this.registerRequestHandler(ExplorerMessages.CopyFullNodePath, fn);
	}

	registerLaunchUrl(fn: IpcListener<string>) {
		this.registerRequestHandler(ExplorerMessages.LaunchUrl, fn);
	}
}
