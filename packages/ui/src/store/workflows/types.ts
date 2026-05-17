import type { TemplateKey, WorkflowFile } from '@beak/state/workflows';

export const ActionTypes = {
	START_WORKFLOWS: '@beak/global/workflows/START_WORKFLOWS',
	WORKFLOWS_OPENED: '@beak/global/workflows/WORKFLOWS_OPENED',

	CREATE_NEW_WORKFLOW: '@beak/global/workflows/CREATE_NEW_WORKFLOW',
	DUPLICATE_WORKFLOW: '@beak/global/workflows/DUPLICATE_WORKFLOW',
	REMOVE_WORKFLOW_FROM_DISK: '@beak/global/workflows/REMOVE_WORKFLOW_FROM_DISK',

	SET_LATEST_WRITE: '@beak/global/workflows/SET_LATEST_WRITE',
	SET_WRITE_DEBOUNCE: '@beak/global/workflows/SET_WRITE_DEBOUNCE',
};

export interface State {
	loaded: boolean;

	workflows: Record<string, WorkflowFile>;

	latestWrite?: number;
	writeDebouncer: string;
}

export const initialState: State = {
	loaded: false,

	workflows: {},

	latestWrite: 0,
	writeDebouncer: '',
};

export interface CreateNewWorkflowPayload {
	name?: string;
	/** Tree folder id to land the new workflow inside. Omit for project root. */
	parent?: string | null;
	/** Starter template; defaults to 'blank' (single Start node, no wiring). */
	template?: TemplateKey;
	/** Optional initial description; persisted directly onto the workflow. */
	description?: string;
	/** Optional initial tags; persisted directly (no normalisation here — the slice action handles that on every update). */
	tags?: string[];
}

export interface DuplicateWorkflowPayload {
	/** Source workflow id to clone. */
	sourceId: string;
	/**
	 * Optional explicit name for the clone; defaults to "Copy of <source>".
	 * The effect strips/respects this — keep blank for the default behaviour.
	 */
	name?: string;
	/** When true (default), open the new workflow in a permanent tab. */
	openTab?: boolean;
}

export interface RemoveWorkflowFromDiskPayload {
	id: string;
	withConfirmation: boolean;
}

export default {
	ActionTypes,
	initialState,
};
