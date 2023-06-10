import type { IpcMain } from 'electron';

import { RecentProject } from '../types/beak-hub';
import { IpcServiceMain, IpcServiceRenderer, Listener, PartialIpcMain, PartialIpcRenderer } from './ipc';

export const BeakHubMessages = {
	ListRecentProjects: 'list_recent_projects',
};

export class IpcBeakHubServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: PartialIpcRenderer) {
		super('beak_hub', ipc);
	}

	async listRecentProjects() {
		return this.invoke<RecentProject[]>(BeakHubMessages.ListRecentProjects);
	}
}

export class IpcBeakHubServiceMain extends IpcServiceMain {
	constructor(ipc: PartialIpcMain) {
		super('beak_hub', ipc);
	}

	registerListRecentProjects(fn: Listener<void, RecentProject[]>) {
		this.registerListener(BeakHubMessages.ListRecentProjects, fn);
	}
}
