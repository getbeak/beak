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
};

export interface State {
	opening: boolean;
	name?: string;
	projectPath?: string;
	tree?: Tree;

	selectedRequest?: string;
}

export const initialState: State = {
	opening: true,
};

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

export default {
	ActionTypes,
	initialState,
};
