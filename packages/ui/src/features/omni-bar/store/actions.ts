import { createAction } from '@reduxjs/toolkit';

import { ActionTypes, ShowOmniBarPayload } from './types';

export const showOmniBar = createAction<ShowOmniBarPayload>(ActionTypes.SHOW_OMNI_BAR);
export const hideOmniBar = createAction(ActionTypes.HIDE_OMNI_BAR);

export default {
	showOmniBar,
	hideOmniBar,
};
