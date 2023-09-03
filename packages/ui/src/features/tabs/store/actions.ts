import { TabItem } from '@beak/common/types/beak-project';
import { createAction } from '@reduxjs/toolkit';

import { ActionTypes, State } from './types';

export const loadTabState = createAction(ActionTypes.LOAD_TAB_STATE);
export const tabStateLoaded = createAction<State>(ActionTypes.TAB_STATE_LOADED);

export const changeTab = createAction<TabItem>(ActionTypes.CHANGE_TAB);
export const changeTabNext = createAction(ActionTypes.CHANGE_TAB_NEXT);
export const changeTabPrevious = createAction(ActionTypes.CHANGE_TAB_PREVIOUS);
export const makeTabPermanent = createAction<string | undefined>(ActionTypes.MAKE_TAB_PERMANENT);

export const closeTab = createAction<string | undefined>(ActionTypes.CLOSE_TAB);
export const closeTabsOther = createAction<string | undefined>(ActionTypes.CLOSE_TABS_OTHER);
export const closeTabsLeft = createAction<string | undefined>(ActionTypes.CLOSE_TABS_LEFT);
export const closeTabsRight = createAction<string | undefined>(ActionTypes.CLOSE_TABS_RIGHT);
export const closeTabsAll = createAction<string | undefined>(ActionTypes.CLOSE_TABS_ALL);

export const attemptReconciliation = createAction(ActionTypes.ATTEMPT_RECONCILIATION);
export const reconciliationComplete = createAction(ActionTypes.RECONCILIATION_COMPLETE);

export default {
	loadTabState,
	tabStateLoaded,

	changeTab,
	changeTabNext,
	changeTabPrevious,
	makeTabPermanent,

	closeTab,
	closeTabsOther,
	closeTabsLeft,
	closeTabsRight,
	closeTabsAll,

	attemptReconciliation,
	reconciliationComplete,
};
