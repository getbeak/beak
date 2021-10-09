import type { IpcMain } from 'electron';

import { GetSubscriptionStatusResponse, NewsItem } from '../types/nest';
import { IpcServiceMain, IpcServiceRenderer, Listener, PartialIpcRenderer } from './ipc';

export const NestMessages = {
	SendMagicLink: 'send_magic_link',
	HandleMagicLink: 'handle_magic_link',
	ListNewsItems: 'list_news_items',
	GetSubscriptionState: 'get_subscription_state',
};

interface HandleMagicLinkReq {
	code: string;
	state: string;
	fromOnboarding?: boolean;
}

export class IpcNestServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: PartialIpcRenderer) {
		super('nest', ipc);
	}

	async sendMagicLink(email: string) {
		return this.invoke(NestMessages.SendMagicLink, email);
	}

	async handleMagicLink(payload: HandleMagicLinkReq) {
		return this.invoke(NestMessages.HandleMagicLink, payload);
	}

	async listNewsItems(clientId?: string) {
		return this.invoke<NewsItem[]>(NestMessages.ListNewsItems, clientId);
	}

	async getSubscriptionState() {
		return this.invoke<GetSubscriptionStatusResponse>(NestMessages.GetSubscriptionState);
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

	registerListNewsItems(fn: Listener<string | undefined, NewsItem[]>) {
		this.registerListener(NestMessages.ListNewsItems, fn);
	}

	registerGetSubscriptionState(fn: Listener<void, GetSubscriptionStatusResponse>) {
		this.registerListener(NestMessages.GetSubscriptionState, fn);
	}
}
