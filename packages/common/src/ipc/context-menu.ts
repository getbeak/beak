import type { MenuItemConstructorOptions, WebContents } from 'electron';
import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

export const ContextMenuMessages = {
	OpenContextMenu: 'open_context_menu',
	ItemClickEvent: 'item_click_event',
};

interface MenuItem extends Pick<MenuItemConstructorOptions, 'label' | 'type' | 'enabled' | 'accelerator'> {
	id: string;
}

interface Base {
	id: string;
}

export interface OpenContextMenuPayload extends Base {
	menuItems: MenuItem[];
}

export interface ItemClickEventPayload extends Base {
	menuItemId: string;
}

export class IpcContextMenuServiceRenderer extends IpcServiceRenderer<'context_menu'> {
	constructor(ipc: PartialIpcRenderer) {
		super('context_menu', ipc);
	}

	async openContextMenu(payload: OpenContextMenuPayload) {
		await this.invoke(ContextMenuMessages.OpenContextMenu, payload);
	}

	registerItemClickEvent(fn: IpcListener<ItemClickEventPayload>) {
		this.registerListener(ContextMenuMessages.ItemClickEvent, fn);
	}
}

export class IpcContextMenuServiceMain extends IpcServiceMain<'context_menu'> {
	constructor(ipc: PartialIpcMain) {
		super('context_menu', ipc);
	}

	registerOpenContextMenu(fn: IpcListener<OpenContextMenuPayload>) {
		this.registerRequestHandler(ContextMenuMessages.OpenContextMenu, fn);
	}

	sendItemClickEvent(wc: WebContents, payload: ItemClickEventPayload) {
		this.sendMessage(wc, ContextMenuMessages.ItemClickEvent, payload);
	}
}
