import { IpcMain, IpcRenderer } from 'electron';

import { ArbiterStatus } from '../types/arbiter';
import { IpcServiceMain, IpcServiceRenderer, Listener } from './ipc';

export const ArbiterMessages = {
	GetStatus: 'get_status',
};

export class IpcArbiterServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: IpcRenderer) {
		super('arbiter', ipc);
	}

	async getStatus() {
		return this.invoke<ArbiterStatus>(ArbiterMessages.GetStatus);
	}
}

export class IpcArbiterServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('arbiter', ipc);
	}

	registerGetStatus(fn: Listener<void, ArbiterStatus>) {
		this.registerListener(ArbiterMessages.GetStatus, fn);
	}
}
