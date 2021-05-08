import { IpcMain, IpcRenderer } from 'electron';

import { IpcServiceMain, IpcServiceRenderer, Listener } from './ipc';

export const NestMessages = {
	SendMagicLink: 'send_magic_link',
	HandleMagicLink: 'handle_magic_link',
};

interface HandleMagicLinkReq {
	code: string;
	state: string;
	fromOnboarding?: boolean;
}

export class IpcNestServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: IpcRenderer) {
		super('nest', ipc);
	}

	async sendMagicLink(email: string) {
		return this.invoke(NestMessages.SendMagicLink, email);
	}

	async handleMagicLink(payload: HandleMagicLinkReq) {
		return this.invoke(NestMessages.HandleMagicLink, payload);
	}
}

export class IpcNestServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('nest', ipc);
	}

	registerSendMagicLink(fn: Listener<string>) {
		this.registerListener(NestMessages.SendMagicLink, fn);
	}

	registerHandleMagicLink(fn: Listener<HandleMagicLinkReq>) {
		this.registerListener(NestMessages.HandleMagicLink, fn);
	}
}
