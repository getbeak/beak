// Reducer-bound actions live in @beak/state/workflows — re-export so the UI
// shares the same action types (otherwise the pure reducer never runs).
import {
	addEdge,
	addNode,
	duplicateNode,
	insertNewWorkflow,
	moveNode,
	purgeRequestRefs,
	removeEdge,
	removeNode,
	removeWorkflowFromStore,
	replaceGraph,
	setWorkflowParent,
	startWorkflows,
	updateNode,
	updateNodeData,
	updateWorkflowName,
	workflowsOpened,
} from '@beak/state/workflows';
import { createAction } from '@reduxjs/toolkit';

export {
	addEdge,
	addNode,
	duplicateNode,
	insertNewWorkflow,
	moveNode,
	purgeRequestRefs,
	removeEdge,
	removeNode,
	removeWorkflowFromStore,
	replaceGraph,
	setWorkflowParent,
	startWorkflows,
	updateNode,
	updateNodeData,
	updateWorkflowName,
	workflowsOpened,
};

import { ActionTypes as AT, type CreateNewWorkflowPayload, type RemoveWorkflowFromDiskPayload } from './types';

// UI-only side-effect triggers — listened to by effects, not reduced.
export const createNewWorkflow = createAction<CreateNewWorkflowPayload>(AT.CREATE_NEW_WORKFLOW);
export const removeWorkflowFromDisk = createAction<RemoveWorkflowFromDiskPayload>(AT.REMOVE_WORKFLOW_FROM_DISK);

export const setLatestWrite = createAction<number>(AT.SET_LATEST_WRITE);
export const setWriteDebounce = createAction<string>(AT.SET_WRITE_DEBOUNCE);

export default {
	startWorkflows,
	workflowsOpened,

	createNewWorkflow,
	insertNewWorkflow,
	updateWorkflowName,
	setWorkflowParent,

	addNode,
	updateNode,
	updateNodeData,
	moveNode,
	removeNode,
	duplicateNode,

	addEdge,
	removeEdge,

	replaceGraph,

	removeWorkflowFromStore,
	removeWorkflowFromDisk,

	setLatestWrite,
	setWriteDebounce,
};
