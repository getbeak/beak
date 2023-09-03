export const ActionTypes = {
	START_ARBITER: '@beak/global/arbiter/START_ARBITER',
	UPDATE_STATUS: '@beak/global/arbiter/UPDATE_STATUS',
};

export interface State {
	status: boolean;
}

export const initialState: State = {
	status: true,
};

export default {
	ActionTypes,
	initialState,
};
