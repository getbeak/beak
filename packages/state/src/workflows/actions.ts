import { createAction } from '@reduxjs/toolkit';

import type {
	AddEdgePayload,
	AddNodePayload,
	InsertNewWorkflowPayload,
	MoveNodePayload,
	RemoveEdgePayload,
	RemoveNodePayload,
	ReplaceGraphPayload,
	SetWorkflowParentPayload,
	UpdateNodeDataPayload,
	UpdateNodePayload,
	UpdateWorkflowNamePayload,
	WorkflowsOpenedPayload,
} from './types';

export const startWorkflows = createAction('workflows/startWorkflows');
export const workflowsOpened = createAction<WorkflowsOpenedPayload>('workflows/workflowsOpened');

export const insertNewWorkflow = createAction<InsertNewWorkflowPayload>('workflows/insertNewWorkflow');
export const updateWorkflowName = createAction<UpdateWorkflowNamePayload>('workflows/updateWorkflowName');
export const setWorkflowParent = createAction<SetWorkflowParentPayload>('workflows/setWorkflowParent');

export const addNode = createAction<AddNodePayload>('workflows/addNode');
export const updateNode = createAction<UpdateNodePayload>('workflows/updateNode');
export const updateNodeData = createAction<UpdateNodeDataPayload>('workflows/updateNodeData');
export const moveNode = createAction<MoveNodePayload>('workflows/moveNode');
export const removeNode = createAction<RemoveNodePayload>('workflows/removeNode');

export const addEdge = createAction<AddEdgePayload>('workflows/addEdge');
export const removeEdge = createAction<RemoveEdgePayload>('workflows/removeEdge');

export const replaceGraph = createAction<ReplaceGraphPayload>('workflows/replaceGraph');

export const removeWorkflowFromStore = createAction<string>('workflows/removeWorkflowFromStore');
