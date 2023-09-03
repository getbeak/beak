import { IpcServiceMain, IpcServiceRenderer, Listener, PartialIpcMain, PartialIpcRenderer } from './ipc';

const WindowMessages = {
	CloseSelfWindow: 'close_self_window',
	ReloadSelfWindow: 'reload_self_window',
	ToggleDeveloperTools: 'toggle_developer_tools',
};

export class IpcWindowServiceRenderer extends IpcServiceRenderer {
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
}

export class IpcWindowServiceMain extends IpcServiceMain {
	constructor(ipc: PartialIpcMain) {
		super('window', ipc);
	}

	registerCloseSelfWindow(fn: Listener) {
		this.registerListener(WindowMessages.CloseSelfWindow, fn);
	}

	registerReloadSelfWindow(fn: Listener) {
		this.registerListener(WindowMessages.ReloadSelfWindow, fn);
	}

	registerToggleDeveloperTools(fn: Listener) {
		this.registerListener(WindowMessages.ToggleDeveloperTools, fn);
	}
}
