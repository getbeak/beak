import type { RecentProject, RecentProjectSource } from '../types/beak-hub';
import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

export const BeakHubMessages = {
	ListRecentProjects: 'list_recent_projects',
	GetRootSource: 'get_root_source',
};

export class IpcBeakHubServiceRenderer extends IpcServiceRenderer<'beak_hub'> {
	constructor(ipc: PartialIpcRenderer) {
		super('beak_hub', ipc);
	}

	async listRecentProjects() {
		return this.invoke<RecentProject[]>(BeakHubMessages.ListRecentProjects);
	}

	/**
	 * What kind of storage the current window's project lives in. Lets the
	 * renderer gate features like the "Save to local folder" banner without
	 * dragging the host's internals into the UI.
	 *
	 * Electron always returns `desktop`. Web returns `browser` when the fs is
	 * rooted at the OPFS sandbox and `local-folder` when the user has mounted
	 * a folder via the File System Access API.
	 */
	async getRootSource() {
		return this.invoke<RecentProjectSource>(BeakHubMessages.GetRootSource);
	}
}

export class IpcBeakHubServiceMain extends IpcServiceMain<'beak_hub'> {
	constructor(ipc: PartialIpcMain) {
		super('beak_hub', ipc);
	}

	registerListRecentProjects(fn: IpcListener<void>) {
		this.registerRequestHandler(BeakHubMessages.ListRecentProjects, fn);
	}

	registerGetRootSource(fn: IpcListener<void>) {
		this.registerRequestHandler(BeakHubMessages.GetRootSource, fn);
	}
}
