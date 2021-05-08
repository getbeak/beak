import {
	IpcMain,
	IpcRenderer,
} from 'electron';

import { IpcServiceMain, IpcServiceRenderer, Listener } from './ipc';

const WindowMessages = {
	CloseSelfWindow: 'close_self_window',
};

export class IpcWindowServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: IpcRenderer) {
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
