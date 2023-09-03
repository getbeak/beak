export const ActionTypes = {
	START_GIT: '@beak/global/git/START_GIT',
	GIT_OPENED: '@beak/global/git/GIT_OPENED',

	ADD_BRANCH: '@beak/global/git/ADD_BRANCH',
	REMOVE_BRANCH: '@beak/global/git/REMOVE_BRANCH',
	CHANGE_SELECTED_BRANCH: '@beak/global/git/CHANGE_SELECTED_BRANCH',
};

export interface State {
	branches: Branch[];
	selectedBranch: string | undefined;
}

export const initialState: State = {
	branches: [],
	selectedBranch: void 0,
};

export interface Branch {
	name: string;
}

export interface GitOpenedPayload {
	branches: Branch[];
	selectedBranch: string | undefined;
}

export default {
	ActionTypes,
	initialState,
};
