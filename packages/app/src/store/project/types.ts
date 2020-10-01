import { Tree } from '../../lib/project/types';

export const ActionTypes = {
	OPEN_PROJECT: '@beak/global/project/OPEN_PROJECT',
	PROJECT_OPENED: '@beak/global/project/PROJECT_OPENED',

	REQUEST_SELECTED: '@beak/global/project/REQUEST_SELECTED',

	REQUEST_URI_UPDATED: '@beak/global/project/REQUEST_URI_UPDATED',

	REQUEST_QUERY_ADDED: '@beak/global/project/REQUEST_QUERY_ADDED',
	REQUEST_QUERY_UPDATED: '@beak/global/project/REQUEST_QUERY_UPDATED',
	REQUEST_QUERY_REMOVED: '@beak/global/project/REQUEST_QUERY_REMOVED',

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

export interface RequestUriUpdatedPayload {
	requestId: string;
	protocol?: string;
	verb?: string;
	hostname?: string;
	path?: string;
	fragment?: string;
}

export interface RequestQueryUpdatedPayload {
	requestId: string;
	queryId: string;
	name?: string;
	value?: string;
	enabled?: boolean;
}

export interface RequestQueryRemovedPayload {
	requestId: string;
	queryId: string;
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
