import { IpcMain, IpcRenderer } from 'electron';

import { RecentLocalProject } from '../types/beak-hub';
import { AsyncListener, IpcServiceMain, IpcServiceRenderer } from './ipc';

export class IpcBeakHubServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: IpcRenderer) {
		super('beak_hub', ipc);
	}

	async listRecentProjects(): Promise<RecentLocalProject[]> {
		return this.ipc.invoke(this.channel, { code: 'list_recent_projects' });
	}
}

export class IpcBeakHubServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('beak_hub', ipc);
	}

	registerListRecentProjects(fn: AsyncListener<void, RecentLocalProject[]>) {
		this.registerListener('list_recent_projects', fn);
	}
}
