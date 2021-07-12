export const ActionTypes = {
	SHOW_OMNI_BAR: '@beak/features/omni-bar/SHOW_OMNI_BAR',
	HIDE_OMNI_BAR: '@beak/features/omni-bar/HIDE_OMNI_BAR',
};

export type OmniMode = 'search' | 'commands';

export interface State {
	open: boolean;
	mode?: OmniMode;
}

export interface ShowOmniBarPayload {
	mode: OmniMode;
}

export const initialState: State = {
	open: false,
	mode: void 0,
};

export default {
	ActionTypes,
	initialState,
};
