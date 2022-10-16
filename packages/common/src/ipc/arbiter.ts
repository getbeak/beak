import type { IpcMain } from 'electron';

import { ArbiterStatus } from '../types/arbiter';
import { IpcServiceMain, IpcServiceRenderer, Listener, PartialIpcRenderer } from './ipc';

export const ArbiterMessages = {
	GetStatus: 'get_status',
	CheckStatus: 'check_status',
};

export class IpcArbiterServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: PartialIpcRenderer) {
		super('arbiter', ipc);
	}

	async getStatus() {
		return this.invoke<ArbiterStatus>(ArbiterMessages.GetStatus);
	}

	async checkStatus() {
		return this.invoke(ArbiterMessages.CheckStatus);
	}
}

export class IpcArbiterServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('arbiter', ipc);
	}

	registerGetStatus(fn: Listener<void, ArbiterStatus>) {
		this.registerListener(ArbiterMessages.GetStatus, fn);
	}

	registerCheckStatus(fn: Listener<void, void>) {
		this.registerListener(ArbiterMessages.CheckStatus, fn);
	}
}
