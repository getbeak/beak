import { Tree } from '@beak/common/types/beak-project';

export const ActionTypes = {
	OPEN_PROJECT: '@beak/global/project/OPEN_PROJECT',
	PROJECT_OPENED: '@beak/global/project/PROJECT_OPENED',

	START_FS_LISTENER: '@beak/global/project/START_FS_LISTENER',

	REQUEST_SELECTED: '@beak/global/project/REQUEST_SELECTED',

	REQUEST_URI_UPDATED: '@beak/global/project/REQUEST_URI_UPDATED',

	REQUEST_QUERY_ADDED: '@beak/global/project/REQUEST_QUERY_ADDED',
	REQUEST_QUERY_UPDATED: '@beak/global/project/REQUEST_QUERY_UPDATED',
	REQUEST_QUERY_REMOVED: '@beak/global/project/REQUEST_QUERY_REMOVED',

	REQUEST_HEADER_ADDED: '@beak/global/project/REQUEST_HEADER_ADDED',
	REQUEST_HEADER_UPDATED: '@beak/global/project/REQUEST_HEADER_UPDATED',
	REQUEST_HEADER_REMOVED: '@beak/global/project/REQUEST_HEADER_REMOVED',

	REQUEST_BODY_TEXT_CHANGED: '@beak/global/project/REQUEST_BODY_TEXT_CHANGED',
	REQUEST_BODY_JSON_CHANGED: '@beak/global/project/REQUEST_BODY_JSON_CHANGED',

	INSERT_REQUEST_NODE: '@beak/global/project/INSERT_REQUEST_NODE',
	REMOVE_REQUEST_NODE: '@beak/global/project/REMOVE_REQUEST_NODE',
	REFRESH_NODE_STATE: '@beak/global/project/REFRESH_NODE_STATE',
	REPORT_NODE_UPDATE: '@beak/global/project/REPORT_NODE_UPDATE',

	REQUEST_RENAME_STARTED: '@beak/global/project/REQUEST_RENAME_STARTED',
	REQUEST_RENAME_UPDATED: '@beak/global/project/REQUEST_RENAME_UPDATED',
	REQUEST_RENAME_CANCELLED: '@beak/global/project/REQUEST_RENAME_CANCELLED',
	REQUEST_RENAME_SUBMITTED: '@beak/global/project/REQUEST_RENAME_SUBMITTED',
	REQUEST_RENAME_RESOLVED: '@beak/global/project/REQUEST_RENAME_RESOLVED',
};

export interface State {
	opening: boolean;
	name?: string;
	projectPath?: string;
	tree?: Tree;

	selectedRequest?: string;

	activeRename?: ActiveRename;
}

export const initialState: State = {
	opening: true,
};

export interface ActiveRename {
	requestId: string;
	name: string;
}

export interface RequestIdPayload {
	requestId: string;
}

export interface RequestUriUpdatedPayload extends RequestIdPayload {
	protocol?: string;
	verb?: string;
	hostname?: string;
	pathname?: string;
	port?: string;
	fragment?: string;
}

export interface ToggleableItemAddedPayload extends RequestIdPayload {
	name?: string;
	value?: string;
}

export interface ToggleableItemUpdatedPayload extends RequestIdPayload {
	identifier: string;
	name?: string;
	value?: string;
	enabled?: boolean;
}

export interface ToggleableItemRemovedPayload extends RequestIdPayload {
	identifier: string;
}

export interface RequestBodyTextChangedPayload extends RequestIdPayload {
	text: string;
}

export interface RequestBodyJsonChangedPayload extends RequestIdPayload {
	json: string;
}

export interface ProjectOpenedPayload {
	name: string;
	projectPath: string;
	tree: Tree;
}

export interface RequestRenameStarted extends RequestIdPayload { }
export interface RequestRenameCancelled extends RequestIdPayload { }
export interface RequestRenameSubmitted extends RequestIdPayload { }
export interface RequestRenameResolved extends RequestIdPayload { }

export interface RequestRenameUpdated extends RequestIdPayload {
	name: string;
}

export default {
	ActionTypes,
	initialState,
};
