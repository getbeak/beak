import { Tree } from '../../lib/project/types';

export const ActionTypes = {
	OPEN_PROJECT: '@beak/global/project/OPEN_PROJECT',
	PROJECT_OPENED: '@beak/global/project/PROJECT_OPENED',

	REQUEST_SELECTED: '@beak/global/project/REQUEST_SELECTED',

	REQUEST_URI_UPDATED: '@beak/global/project/REQUEST_URI_UPDATED',
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

export interface RequestUriUpdatedPayload {
	requestId: string;
	protocol?: string;
	verb?: string;
	hostname?: string;
	path?: string;
	fragment?: string;
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
