// Reducer-bound actions live in @beak/state/workflows — re-export so the UI
// shares the same action types (otherwise the pure reducer never runs).
import {
	addEdge,
	addNode,
	clearGraph,
	duplicateNode,
	insertNewWorkflow,
	moveNode,
	purgeRequestRefs,
	removeEdge,
	removeNode,
	removeNodes,
	removeWorkflowFromStore,
	renameNode,
	replaceGraph,
	setWorkflowParent,
	setWorkflowTags,
	startWorkflows,
	updateEdgeLabel,
	updateNode,
	updateNodeData,
	updateWorkflowDescription,
	updateWorkflowName,
	workflowsOpened,
} from '@beak/state/workflows';
import { createAction } from '@reduxjs/toolkit';

export {
	addEdge,
	addNode,
	clearGraph,
	duplicateNode,
	insertNewWorkflow,
	moveNode,
	purgeRequestRefs,
	removeEdge,
	removeNode,
	removeNodes,
	removeWorkflowFromStore,
	renameNode,
	replaceGraph,
	setWorkflowParent,
	setWorkflowTags,
	startWorkflows,
	updateEdgeLabel,
	updateNode,
	updateNodeData,
	updateWorkflowDescription,
	updateWorkflowName,
	workflowsOpened,
};

import {
	ActionTypes as AT,
	type CreateNewWorkflowPayload,
	type DuplicateWorkflowPayload,
	type RemoveWorkflowFromDiskPayload,
} from './types';

// UI-only side-effect triggers — listened to by effects, not reduced.
export const createNewWorkflow = createAction<CreateNewWorkflowPayload>(AT.CREATE_NEW_WORKFLOW);
export const duplicateWorkflow = createAction<DuplicateWorkflowPayload>(AT.DUPLICATE_WORKFLOW);
export const removeWorkflowFromDisk = createAction<RemoveWorkflowFromDiskPayload>(AT.REMOVE_WORKFLOW_FROM_DISK);

export const setLatestWrite = createAction<number>(AT.SET_LATEST_WRITE);
export const setWriteDebounce = createAction<string>(AT.SET_WRITE_DEBOUNCE);

export default {
	startWorkflows,
	workflowsOpened,

	createNewWorkflow,
	duplicateWorkflow,
	insertNewWorkflow,
	updateWorkflowName,
	updateWorkflowDescription,
	setWorkflowParent,
	setWorkflowTags,

	addNode,
	updateNode,
	updateNodeData,
	moveNode,
	removeNode,
	removeNodes,
	renameNode,
	duplicateNode,

	addEdge,
	removeEdge,
	updateEdgeLabel,

	replaceGraph,
	clearGraph,

	removeWorkflowFromStore,
	removeWorkflowFromDisk,

	setLatestWrite,
	setWriteDebounce,
};
