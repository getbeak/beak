import { IpcMain, IpcRenderer } from 'electron';

import { ArbiterStatus } from '../types/arbiter';
import { AsyncListener, IpcServiceMain, IpcServiceRenderer } from './ipc';

export const ArbiterMessages = {
	GetStatus: 'get_status',
};

export class IpcArbiterServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: IpcRenderer) {
		super('arbiter', ipc);
	}

	async getStatus(): Promise<ArbiterStatus> {
		return this.ipc.invoke(this.channel, { code: ArbiterMessages.GetStatus });
	}
}

export class IpcArbiterServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('arbiter', ipc);
	}

	registerGetStatus(fn: AsyncListener<void, ArbiterStatus>) {
		this.registerListener(ArbiterMessages.GetStatus, fn);
	}
}
