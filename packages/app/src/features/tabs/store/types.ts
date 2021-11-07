import { TabItem } from '@beak/common/types/beak-project';

export const ActionTypes = {
	LOAD_TAB_STATE: '@beak/features/tabs/LOAD_TAB_STATE',
	TAB_STATE_LOADED: '@beak/features/tabs/TAB_STATE_LOADED',

	CHANGE_TAB: '@beak/features/tabs/CHANGE_TAB',
	CHANGE_TAB_NEXT: '@beak/features/tabs/CHANGE_TAB_NEXT',
	CHANGE_TAB_PREVIOUS: '@beak/features/tabs/CHANGE_TAB_PREVIOUS',
	MAKE_TAB_PERMANENT: '@beak/features/tabs/MAKE_TAB_PERMANENT',

	CLOSE_TAB: '@beak/features/tabs/CLOSE_TAB',
	CLOSE_TABS_OTHER: '@beak/features/tabs/CLOSE_TABS_OTHER',
	CLOSE_TABS_LEFT: '@beak/features/tabs/CLOSE_TABS_LEFT',
	CLOSE_TABS_RIGHT: '@beak/features/tabs/CLOSE_TABS_RIGHT',
	CLOSE_TABS_ALL: '@beak/features/tabs/CLOSE_TABS_ALL',

	ATTEMPT_RECONCILIATION: '@beak/features/tabs/ATTEMPT_RECONCILIATION',
	RECONCILIATION_COMPLETE: '@beak/features/tabs/RECONCILIATION_COMPLETE',
};

export interface State {
	selectedTab: string | undefined;
	activeTabs: TabItem[];
	recentlyClosedTabs: TabItem[];

	lastReconcile: number;
	loaded: boolean;
}

export const initialState: State = {
	selectedTab: void 0,
	activeTabs: [],
	recentlyClosedTabs: [],

	lastReconcile: 0,
	loaded: false,
};

export default {
	ActionTypes,
	initialState,
};
