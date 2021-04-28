import { IpcMain, IpcRenderer } from 'electron';

import { AsyncListener, IpcServiceMain, IpcServiceRenderer } from './ipc';

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
		return this.ipc.invoke(this.channel, {
			code: NestMessages.SendMagicLink,
			payload: email,
		});
	}

	async handleMagicLink(payload: HandleMagicLinkReq) {
		return this.ipc.invoke(this.channel, {
			code: NestMessages.HandleMagicLink,
			payload,
		});
	}
}

export class IpcNestServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('nest', ipc);
	}

	registerSendMagicLink(fn: AsyncListener<string>) {
		this.registerListener(NestMessages.SendMagicLink, fn);
	}

	registerHandleMagicLink(fn: AsyncListener<HandleMagicLinkReq>) {
		this.registerListener(NestMessages.HandleMagicLink, fn);
	}
}
