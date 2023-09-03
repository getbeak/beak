export const ActionTypes = {
	SHOW_ENCRYPTION_VIEW: '@beak/features/encryption/SHOW_ENCRYPTION_VIEW',
	HIDE_ENCRYPTION_VIEW: '@beak/features/encryption/HIDE_ENCRYPTION_VIEW',
};

export interface State {
	open: boolean;
}

export const initialState: State = {
	open: false,
};

export default {
	ActionTypes,
	initialState,
};
