import type { IpcMain } from 'electron';

import { IpcServiceMain, IpcServiceRenderer, Listener, PartialIpcRenderer } from './ipc';

const WindowMessages = {
	CloseSelfWindow: 'close_self_window',
};

export class IpcWindowServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: PartialIpcRenderer) {
		super('window', ipc);
	}

	async closeSelfWindow() {
		return await this.invoke(WindowMessages.CloseSelfWindow);
	}
}

export class IpcWindowServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('window', ipc);
	}

	registerCloseSelfWindow(fn: Listener) {
		this.registerListener(WindowMessages.CloseSelfWindow, fn);
	}
}
