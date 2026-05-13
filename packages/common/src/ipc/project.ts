import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

export const ProjectMessages = {
	OpenFolder: 'open_folder',
	OpenProject: 'open_project',
	CreateProject: 'create_project',
	PromoteUntitled: 'promote_untitled',
};

export interface CreateProjectReq {
	projectName: string;
}

export interface PromoteUntitledReq {
	/** Folder of the current untitled project (the one to move). */
	currentFolderPath: string;
	/** Optional new name; defaults to the destination folder's basename. */
	newName?: string;
}

export interface PromoteUntitledRes {
	projectId: string;
	projectFilePath: string;
}

export class IpcProjectServiceRenderer extends IpcServiceRenderer<'project'> {
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

	async promoteUntitled(payload: PromoteUntitledReq): Promise<PromoteUntitledRes | null> {
		return await this.invoke<PromoteUntitledRes | null>(ProjectMessages.PromoteUntitled, payload);
	}
}

export class IpcProjectServiceMain extends IpcServiceMain<'project'> {
	constructor(ipc: PartialIpcMain) {
		super('project', ipc);
	}

	registerOpenFolder(fn: IpcListener<string>) {
		this.registerRequestHandler(ProjectMessages.OpenFolder, fn);
	}

	registerOpenProject(fn: IpcListener<void>) {
		this.registerRequestHandler(ProjectMessages.OpenProject, fn);
	}

	registerCreateProject(fn: IpcListener<CreateProjectReq>) {
		this.registerRequestHandler(ProjectMessages.CreateProject, fn);
	}

	registerPromoteUntitled(fn: IpcListener<PromoteUntitledReq>) {
		this.registerRequestHandler(ProjectMessages.PromoteUntitled, fn);
	}
}
