import { IpcMain, IpcRenderer } from 'electron';

import { RecentLocalProject } from '../types/beak-hub';
import { IpcServiceMain, IpcServiceRenderer, Listener } from './ipc';

export const BeakHubMessages = {
	ListRecentProjects: 'list_recent_projects',
};

export class IpcBeakHubServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: IpcRenderer) {
		super('beak_hub', ipc);
	}

	async listRecentProjects() {
		return this.invoke<RecentLocalProject[]>(BeakHubMessages.ListRecentProjects);
	}
}

export class IpcBeakHubServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('beak_hub', ipc);
	}

	registerListRecentProjects(fn: Listener<void, RecentLocalProject[]>) {
		this.registerListener(BeakHubMessages.ListRecentProjects, fn);
	}
}
