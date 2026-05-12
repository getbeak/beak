import type { GetSubscriptionStatusResponse, GetUserResponse, NewsItem } from '../types/nest';
import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

export const NestMessages = {
	SendMagicLink: 'send_magic_link',
	CreateTrialAndMagicLink: 'create_trial_and_magic_link',
	HandleMagicLink: 'handle_magic_link',
	ListNewsItems: 'list_news_items',
	GetSubscriptionState: 'get_subscription_state',
	GetUser: 'get_user',
	HasAuth: 'has_auth',
};

interface HandleMagicLinkReq {
	code: string;
	state: string;
	fromPortal?: boolean;
	fromTrial?: boolean;
}

export class IpcNestServiceRenderer extends IpcServiceRenderer<'nest'> {
	constructor(ipc: PartialIpcRenderer) {
		super('nest', ipc);
	}

	async sendMagicLink(email: string) {
		return this.invoke(NestMessages.SendMagicLink, email);
	}

	async createTrialAndMagicLink(email: string) {
		return this.invoke(NestMessages.CreateTrialAndMagicLink, email);
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

	async getUser() {
		return this.invoke<GetUserResponse>(NestMessages.GetUser);
	}

	async hasAuth() {
		return this.invoke<boolean>(NestMessages.HasAuth);
	}
}

export class IpcNestServiceMain extends IpcServiceMain<'nest'> {
	constructor(ipc: PartialIpcMain) {
		super('nest', ipc);
	}

	registerSendMagicLink(fn: IpcListener<string>) {
		this.registerRequestHandler(NestMessages.SendMagicLink, fn);
	}

	registerCreateTrialAndMagicLink(fn: IpcListener<string>) {
		this.registerRequestHandler(NestMessages.CreateTrialAndMagicLink, fn);
	}

	registerHandleMagicLink(fn: IpcListener<HandleMagicLinkReq>) {
		this.registerRequestHandler(NestMessages.HandleMagicLink, fn);
	}

	registerListNewsItems(fn: IpcListener<string | undefined>) {
		this.registerRequestHandler(NestMessages.ListNewsItems, fn);
	}

	registerGetSubscriptionState(fn: IpcListener<void>) {
		this.registerRequestHandler(NestMessages.GetSubscriptionState, fn);
	}

	registerGetUser(fn: IpcListener<void>) {
		this.registerRequestHandler(NestMessages.GetUser, fn);
	}

	registerHasAuth(fn: IpcListener<void>) {
		this.registerRequestHandler(NestMessages.HasAuth, fn);
	}
}
