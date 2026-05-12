import type { Nodes } from '@getbeak/types/nodes';
import { createAction } from '@reduxjs/toolkit';

import type { ProjectInfoPayload, ProjectOpenedPayload } from './types';

export const startProject = createAction('project/startProject');
export const insertProjectInfo = createAction<ProjectInfoPayload>('project/insertProjectInfo');
export const projectOpened = createAction<ProjectOpenedPayload>('project/projectOpened');

export const insertRequestNode = createAction<Nodes>('project/insertRequestNode');
export const insertFolderNode = createAction<Nodes>('project/insertFolderNode');

export const removeNodeFromStore = createAction<string>('project/removeNodeFromStore');
export const removeNodeFromStoreByPath = createAction<string>('project/removeNodeFromStoreByPath');
