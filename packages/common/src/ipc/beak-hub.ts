import type { RecentProject } from '../types/beak-hub';
import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

export const BeakHubMessages = {
	ListRecentProjects: 'list_recent_projects',
};

export class IpcBeakHubServiceRenderer extends IpcServiceRenderer<'beak_hub'> {
	constructor(ipc: PartialIpcRenderer) {
		super('beak_hub', ipc);
	}

	async listRecentProjects() {
		return this.invoke<RecentProject[]>(BeakHubMessages.ListRecentProjects);
	}
}

export class IpcBeakHubServiceMain extends IpcServiceMain<'beak_hub'> {
	constructor(ipc: PartialIpcMain) {
		super('beak_hub', ipc);
	}

	registerListRecentProjects(fn: IpcListener<void>) {
		this.registerRequestHandler(BeakHubMessages.ListRecentProjects, fn);
	}
}
