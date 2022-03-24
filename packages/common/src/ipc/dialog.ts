import {
	IpcMain,
	MessageBoxOptions,
	MessageBoxReturnValue,
} from 'electron';

import { IpcServiceMain, IpcServiceRenderer, Listener, PartialIpcRenderer } from './ipc';

export const DialogMessages = {
	ShowMessageBox: 'show_message_box',
};

export interface ShowMessageBoxReq extends MessageBoxOptions { }
export interface ShowMessageBoxRes extends MessageBoxReturnValue { }

export class IpcDialogServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: PartialIpcRenderer) {
		super('dialog', ipc);
	}

	async showMessageBox(options: ShowMessageBoxReq) {
		return this.invoke<ShowMessageBoxRes>(DialogMessages.ShowMessageBox, options);
	}
}

export class IpcDialogServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('dialog', ipc);
	}

	registerShowMessageBox(fn: Listener<ShowMessageBoxReq, ShowMessageBoxRes>) {
		this.registerListener(DialogMessages.ShowMessageBox, fn);
	}
}
