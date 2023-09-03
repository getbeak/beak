import { createAction } from '@reduxjs/toolkit';

import {
	ActionTypes as AT,
	GitOpenedPayload,
} from './types';

export const startGit = createAction(AT.START_GIT);
export const gitOpened = createAction<GitOpenedPayload>(AT.GIT_OPENED);

export const addBranch = createAction<string>(AT.ADD_BRANCH);
export const removeBranch = createAction<string>(AT.REMOVE_BRANCH);
export const changeSelectedBranch = createAction<string | undefined>(AT.CHANGE_SELECTED_BRANCH);

export default {
	startGit,
	gitOpened,

	addBranch,
	removeBranch,
	changeSelectedBranch,
};
