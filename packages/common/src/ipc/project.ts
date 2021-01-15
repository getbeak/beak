import { IpcMain, IpcRenderer } from 'electron';

import { AsyncListener, IpcServiceMain, IpcServiceRenderer } from './ipc';

export const ProjectMessages = {
	OpenFolder: 'open_folder',
	OpenProject: 'open_project',
	CreateProject: 'create_project',
};

export interface CreateProjectReq {
	projectName: string;
}

export class IpcProjectServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: IpcRenderer) {
		super('project', ipc);
	}

	async openFolder(folderPath: string) {
		return this.ipc.invoke(this.channel, {
			code: ProjectMessages.OpenFolder,
			payload: folderPath,
		});
	}

	async openProject() {
		return this.ipc.invoke(this.channel, {
			code: ProjectMessages.OpenProject,
		});
	}

	async createProject(payload: CreateProjectReq) {
		return this.ipc.invoke(this.channel, {
			code: ProjectMessages.CreateProject,
			payload,
		});
	}
}

export class IpcProjectServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('project', ipc);
	}

	registerOpenFolder(fn: AsyncListener<string>) {
		this.registerListener(ProjectMessages.OpenFolder, fn);
	}

	registerOpenProject(fn: AsyncListener) {
		this.registerListener(ProjectMessages.OpenProject, fn);
	}

	registerCreateProject(fn: AsyncListener<CreateProjectReq>) {
		this.registerListener(ProjectMessages.CreateProject, fn);
	}
}
