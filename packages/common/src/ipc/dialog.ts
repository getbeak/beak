import {
	IpcMain,
	IpcRenderer,
	MessageBoxOptions,
	MessageBoxReturnValue,
} from 'electron';

import { AsyncListener, IpcServiceMain, IpcServiceRenderer } from './ipc';

export interface ShowMessageBoxReq extends MessageBoxOptions { }
export interface ShowMessageBoxRes extends MessageBoxReturnValue { }

export class IpcDialogServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: IpcRenderer) {
		super('dialog', ipc);
	}

	async showMessageBox(options: ShowMessageBoxReq): Promise<ShowMessageBoxRes> {
		return this.ipc.invoke(this.channel, {
			code: 'show_message_box',
			payload: options,
		});
	}
}

export class IpcDialogServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('dialog', ipc);
	}

	registerShowMessageBox(fn: AsyncListener<ShowMessageBoxReq, ShowMessageBoxRes>) {
		this.registerListener('show_message_box', fn);
	}
}
