export const ActionTypes = {
	OPEN_PROJECT: '@beak/global/project/OPEN_PROJECT',
};

export interface State {
	opening: boolean;
	projectFilePath?: string;
	projectDirPath?: string;
}

export const initialState: State = {
	opening: true,
};

export default {
	ActionTypes,
	initialState,
};
