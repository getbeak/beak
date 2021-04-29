import { ArbiterStatus } from '@beak/common/types/arbiter';

export const ActionTypes = {
	START_ARBITER: '@beak/global/arbiter/START_ARBITER',
	UPDATE_STATUS: '@beak/global/arbiter/UPDATE_STATUS',
};

export interface State {
	status: ArbiterStatus;
}

export const initialState: State = {
	status: {
		lastSuccessfulCheck: new Date().toISOString(),
		lastCheck: new Date().toISOString(),
		status: true,
	},
};

export default {
	ActionTypes,
	initialState,
};
