import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

const WindowMessages = {
	CloseSelfWindow: 'close_self_window',
	ReloadSelfWindow: 'reload_self_window',
	ToggleDeveloperTools: 'toggle_developer_tools',
	SetDirty: 'set_dirty',
};

export interface SetDirtyReq {
	dirty: boolean;
}

export class IpcWindowServiceRenderer extends IpcServiceRenderer<'window'> {
	constructor(ipc: PartialIpcRenderer) {
		super('window', ipc);
	}

	async closeSelfWindow() {
		return await this.invoke(WindowMessages.CloseSelfWindow);
	}

	async reloadSelfWindow() {
		return await this.invoke(WindowMessages.ReloadSelfWindow);
	}

	async toggleDeveloperTools() {
		return await this.invoke(WindowMessages.ToggleDeveloperTools);
	}

	async setDirty(payload: SetDirtyReq) {
		return await this.invoke(WindowMessages.SetDirty, payload);
	}
}

export class IpcWindowServiceMain extends IpcServiceMain<'window'> {
	constructor(ipc: PartialIpcMain) {
		super('window', ipc);
	}

	registerCloseSelfWindow(fn: IpcListener<void>) {
		this.registerRequestHandler(WindowMessages.CloseSelfWindow, fn);
	}

	registerReloadSelfWindow(fn: IpcListener<void>) {
		this.registerRequestHandler(WindowMessages.ReloadSelfWindow, fn);
	}

	registerToggleDeveloperTools(fn: IpcListener<void>) {
		this.registerRequestHandler(WindowMessages.ToggleDeveloperTools, fn);
	}

	registerSetDirty(fn: IpcListener<SetDirtyReq>) {
		this.registerRequestHandler(WindowMessages.SetDirty, fn);
	}
}
