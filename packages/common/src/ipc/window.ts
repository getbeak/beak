import {
	IpcMain,
	IpcRenderer,
} from 'electron';

import { AsyncListener, IpcServiceMain, IpcServiceRenderer } from './ipc';

const WindowMessages = {
	CloseSelfWindow: 'close_self_window',
};

export class IpcWindowServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: IpcRenderer) {
		super('window', ipc);
	}

	async closeSelfWindow() {
		return this.ipc.invoke(this.channel, { code: WindowMessages.CloseSelfWindow });
	}
}

export class IpcWindowServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('window', ipc);
	}

	registerCloseSelfWindow(fn: AsyncListener) {
		this.registerListener(WindowMessages.CloseSelfWindow, fn);
	}
}
