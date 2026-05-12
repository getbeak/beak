import type { MessageBoxOptions, MessageBoxReturnValue } from 'electron';
import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

export const DialogMessages = {
	ShowMessageBox: 'show_message_box',
};

export interface ShowMessageBoxReq extends MessageBoxOptions {}
export interface ShowMessageBoxRes extends MessageBoxReturnValue {}

export class IpcDialogServiceRenderer extends IpcServiceRenderer<'dialog'> {
	constructor(ipc: PartialIpcRenderer) {
		super('dialog', ipc);
	}

	async showMessageBox(options: ShowMessageBoxReq) {
		return this.invoke<ShowMessageBoxRes>(DialogMessages.ShowMessageBox, options);
	}
}

export class IpcDialogServiceMain extends IpcServiceMain<'dialog'> {
	constructor(ipc: PartialIpcMain) {
		super('dialog', ipc);
	}

	registerShowMessageBox(fn: IpcListener<ShowMessageBoxReq>) {
		this.registerRequestHandler(DialogMessages.ShowMessageBox, fn);
	}
}
