export const ActionTypes = {
	START_FLIGHT: '@beak/global/flight/START_FLIGHT',
};

export interface State {
	flighting: boolean;
}

export const initialState: State = {
	flighting: false,
};

export default {
	ActionTypes,
	initialState,
};
