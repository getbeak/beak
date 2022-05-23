import type { IpcMain } from 'electron';

import { IpcServiceMain, IpcServiceRenderer, Listener, PartialIpcRenderer } from './ipc';

export const ExtensionsMessages = {
	ExecuteRtvExtension: 'execute_rtv_extension',
};

interface PayloadBase {
	extensionFilePath: string;
}

interface ExecuteRtvExtensionPayload extends PayloadBase {
	name: string;
}

export class IpcExtensionsServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: PartialIpcRenderer) {
		super('extensions', ipc);
	}

	async executeRtvExtension(payload: ExecuteRtvExtensionPayload) {
		return this.invoke(ExtensionsMessages.ExecuteRtvExtension, payload);
	}
}

export class IpcExtensionsServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('extensions', ipc);
	}

	registerExecuteRtvExtension(fn: Listener<ExecuteRtvExtensionPayload>) {
		this.registerListener(ExtensionsMessages.ExecuteRtvExtension, fn);
	}
}
