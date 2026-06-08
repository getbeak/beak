/**
 * Action creators for the workflows slice. All exported names and action type
 * strings are identical to before — consumers that imported from here don't
 * need changes. The implementations moved to `workflows-slice.ts` (ADR 0005).
 */
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
} from './workflows-slice';
