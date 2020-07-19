import { Nodes } from '../../lib/project/types';

export const ActionTypes = {
	OPEN_PROJECT: '@beak/global/project/OPEN_PROJECT',
	PROJECT_OPENED: '@beak/global/project/PROJECT_OPENED',

	REQUEST_SELECTED: '@beak/global/project/REQUEST_SELECTED',
};

export interface State {
	opening: boolean;
	name?: string;
	projectPath?: string;
	tree?: Nodes[];

	selectedRequest?: string;
}

export const initialState: State = {
	opening: true,
};

export interface ProjectOpenedPayload {
	name: string;
	projectPath: string;
	tree: Nodes[];
}

export default {
	ActionTypes,
	initialState,
};
