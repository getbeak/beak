import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

export const ProjectMessages = {
	OpenFolder: 'open_folder',
	OpenProject: 'open_project',
	CreateProject: 'create_project',
	MaterialiseFromMemory: 'materialise_from_memory',
};

export interface CreateProjectReq {
	projectName: string;
}

export interface MaterialiseFromMemoryReq {
	/** Display name; also becomes the new folder name under the user's chosen parent. */
	projectName: string;
	/**
	 * Full in-memory tree as it lives in the renderer's project slice. Each
	 * value is a FolderNode or ValidRequestNode; we type-erase here because
	 * `@beak/common` cannot depend on `@getbeak/types` shapes that are
	 * derived from the schemas package.
	 */
	tree: Record<string, MaterialiseTreeNode>;
	/** Variable-sets state, keyed by display name. Same shape as on disk. */
	variableSets: Record<string, MaterialiseVariableSet>;
}

export interface MaterialiseTreeNode {
	id: string;
	type: 'folder' | 'request';
	mode?: 'valid' | 'failed';
	name: string;
	filePath: string;
	parent: string | null;
	info?: Record<string, unknown>;
}

export interface MaterialiseVariableSet {
	sets: Record<string, string>;
	items: Record<string, string>;
	/**
	 * `values` carry the same `ValueSections` array shape variable-sets
	 * use everywhere (string parts and `{ type, payload }` realtime-value
	 * references). Type-erased here because `@beak/common` cannot depend
	 * on `@getbeak/types`; the host writes them through unchanged.
	 */
	values: Record<string, unknown[]>;
}

export interface MaterialiseFromMemoryRes {
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

	async materialiseFromMemory(payload: MaterialiseFromMemoryReq): Promise<MaterialiseFromMemoryRes | null> {
		return await this.invoke<MaterialiseFromMemoryRes | null>(ProjectMessages.MaterialiseFromMemory, payload);
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

	registerMaterialiseFromMemory(fn: IpcListener<MaterialiseFromMemoryReq>) {
		this.registerRequestHandler(ProjectMessages.MaterialiseFromMemory, fn);
	}
}
