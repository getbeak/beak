import type { IpcMain, IpcRenderer, MenuItemConstructorOptions, WebContents } from 'electron';

import { IpcServiceMain, IpcServiceRenderer, Listener, PartialIpcRenderer } from './ipc';

export const ContextMenuMessages = {
	OpenContextMenu: 'open_context_menu',
	ItemClickEvent: 'item_click_event',
};

interface MenuItem extends Pick<MenuItemConstructorOptions, 'label' | 'type' | 'enabled'> {
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

export class IpcContextMenuServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: PartialIpcRenderer) {
		super('context_menu', ipc);
	}

	async openContextMenu(payload: OpenContextMenuPayload) {
		await this.invoke(ContextMenuMessages.OpenContextMenu, payload);
	}

	registerItemClickEvent(fn: Listener<ItemClickEventPayload>) {
		this.registerListener(ContextMenuMessages.ItemClickEvent, fn);
	}
}

export class IpcContextMenuServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('context_menu', ipc);
	}

	registerOpenContextMenu(fn: Listener<OpenContextMenuPayload, void>) {
		this.registerListener(ContextMenuMessages.OpenContextMenu, fn);
	}

	sendItemClickEvent(wc: WebContents, payload: ItemClickEventPayload) {
		wc.send(this.channel, {
			code: ContextMenuMessages.ItemClickEvent,
			payload,
		});
	}
}
