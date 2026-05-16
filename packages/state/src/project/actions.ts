import type { Nodes } from '@getbeak/types/nodes';
import { createAction } from '@reduxjs/toolkit';

import type { ProjectInfoPayload, ProjectLoadFailedPayload, ProjectOpenedPayload } from './types';

export const startProject = createAction('project/startProject');
export const insertProjectInfo = createAction<ProjectInfoPayload>('project/insertProjectInfo');
export const projectOpened = createAction<ProjectOpenedPayload>('project/projectOpened');
export const projectLoadFailed = createAction<ProjectLoadFailedPayload>('project/projectLoadFailed');
/**
 * Mark this window as the empty workbench — no project on disk, no
 * in-memory project either. Sets `mode: 'none'` and `loaded: true` so the
 * renderer skips the loading splash and goes straight to the welcome tab.
 */
export const markNoProject = createAction('project/markNoProject');

export interface MaterialiseInMemoryProjectPayload {
	id: string;
	name: string;
}

/**
 * Promote an empty workbench (`mode: 'none'`) to an in-memory scratch
 * project (`mode: 'memory'`). Fired as soon as the user takes a tree-
 * mutating action (new request, new folder, …) from the welcome tab.
 * Nothing is written to disk — the project lives entirely in redux until
 * the user picks Save Project As, which transitions us to `mode: 'disk'`.
 */
export const materialiseInMemoryProject = createAction<MaterialiseInMemoryProjectPayload>(
	'project/materialiseInMemoryProject',
);

export const insertRequestNode = createAction<Nodes>('project/insertRequestNode');
export const insertFolderNode = createAction<Nodes>('project/insertFolderNode');

export const removeNodeFromStore = createAction<string>('project/removeNodeFromStore');
export const removeNodeFromStoreByPath = createAction<string>('project/removeNodeFromStoreByPath');

export interface RenameNodeInTreePayload {
	nodeId: string;
	name: string;
}

/**
 * In-memory rename: change a node's display name without touching disk.
 * Used by memory-mode projects (no fs round-trip via the watcher to fold
 * back into the tree). For folders this also re-keys the entry under its
 * new path AND rewrites every descendant's `filePath` / `parent` prefix.
 */
export const renameNodeInTree = createAction<RenameNodeInTreePayload>('project/renameNodeInTree');

export interface MoveNodeInTreePayload {
	/** ksuid for requests; folder.filePath for folders. */
	nodeId: string;
	/**
	 * Destination folder path — what the moved node's new parent will be.
	 * `null` means the project root (we use `'tree'` to match the on-disk
	 * convention).
	 */
	destinationFolderPath: string;
}

/**
 * In-memory move: re-parent a node into a new folder. Folder sources get
 * re-keyed AND have their descendants rewritten (mirrors renameNodeInTree's
 * folder behaviour). Requests just update `filePath` + `parent`.
 */
export const moveNodeInTree = createAction<MoveNodeInTreePayload>('project/moveNodeInTree');
