import { IpcMain, IpcRenderer } from 'electron';

import { AsyncListener, IpcServiceMain, IpcServiceRenderer } from './ipc';

export interface SetUserReq {
	userId: string;
	fromOnboarding?: boolean;
}

export class IpcNestServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: IpcRenderer) {
		super('nest', ipc);
	}

	async setUser(payload: SetUserReq) {
		return this.ipc.invoke(this.channel, {
			code: 'set_user',
			payload,
		});
	}
}

export class IpcNestServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('nest', ipc);
	}

	registerSetUser(fn: AsyncListener<SetUserReq>) {
		this.registerListener('set_user', fn);
	}
}
