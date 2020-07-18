export const ActionTypes = {
	OPEN_PROJECT: '@beak/global/project/OPEN_PROJECT',
	PROJECT_OPENED: '@beak/global/project/PROJECT_OPENED',
};

export interface State {
	opening: boolean;
	name?: string;
	projectPath?: string;
}

export const initialState: State = {
	opening: true,
};

export interface ProjectOpenedPayload {
	name: string;
	projectPath: string;
}

export default {
	ActionTypes,
	initialState,
};
