import type { IpcMain } from 'electron';

import { IpcServiceMain, IpcServiceRenderer, Listener, PartialIpcMain, PartialIpcRenderer } from './ipc';

export const ProjectMessages = {
	OpenFolder: 'open_folder',
	OpenProject: 'open_project',
	CreateProject: 'create_project',
};

export interface CreateProjectReq {
	projectName: string;
}

export class IpcProjectServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: PartialIpcRenderer) {
		super('project', ipc);
	}

	async openFolder(folderPath: string) {
		return await this.invoke(ProjectMessages.OpenFolder, folderPath);
	}

	async openProject() {
		return await this.invoke(ProjectMessages.OpenProject);
	}

	async createProject(payload: CreateProjectReq) {
		return await this.invoke(ProjectMessages.CreateProject, payload);
	}
}

export class IpcProjectServiceMain extends IpcServiceMain {
	constructor(ipc: PartialIpcMain) {
		super('project', ipc);
	}

	registerOpenFolder(fn: Listener<string>) {
		this.registerListener(ProjectMessages.OpenFolder, fn);
	}

	registerOpenProject(fn: Listener) {
		this.registerListener(ProjectMessages.OpenProject, fn);
	}

	registerCreateProject(fn: Listener<CreateProjectReq>) {
		this.registerListener(ProjectMessages.CreateProject, fn);
	}
}
