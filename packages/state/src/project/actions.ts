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

export const insertRequestNode = createAction<Nodes>('project/insertRequestNode');
export const insertFolderNode = createAction<Nodes>('project/insertFolderNode');

export const removeNodeFromStore = createAction<string>('project/removeNodeFromStore');
export const removeNodeFromStoreByPath = createAction<string>('project/removeNodeFromStoreByPath');
