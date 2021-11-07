/* eslint-disable no-param-reassign */
import { movePosition } from '@beak/app/utils/arrays';
import { TabItem } from '@beak/common/types/beak-project';
import { createReducer } from '@reduxjs/toolkit';

import * as actions from './actions';
import { initialState, State } from './types';

const tabsReducer = createReducer(initialState, builder => {
	builder
		.addCase(actions.tabStateLoaded, (_state, { payload }) => payload)

		.addCase(actions.changeTab, (state, { payload }) => {
			state.selectedTab = payload.payload;
		})
		.addCase(actions.makeTabPermanent, (state, { payload }) => {
			const targetTab = getTargetTab(state, payload);

			if (!targetTab)
				return;

			const index = state.activeTabs.findIndex(t => t.payload === targetTab.payload);

			state.activeTabs[index].temporary = false;
		})

		.addCase(actions.closeTab, (state, { payload }) => {
			const targetTab = getTargetTab(state, payload);

			if (!targetTab)
				return;

			const selectedIsTarget = targetTab.payload === state.selectedTab;
			const targetIndex = state.activeTabs.findIndex(t => t.payload === targetTab.payload);

			state.activeTabs.splice(targetIndex, 1);

			updateRecentlyClosed(state, targetTab);

			if (selectedIsTarget) {
				const newIndex = movePosition(state.activeTabs, targetIndex, 'backward');
				const tab = state.activeTabs[newIndex];

				if (tab)
					state.selectedTab = tab.payload;
			}
		})
		.addCase(actions.closeTabsAll, state => {
			if (state.activeTabs.length === 0)
				return;

			updateRecentlyClosed(state, ...state.activeTabs);

			state.activeTabs = [];
		})
		.addCase(actions.closeTabsLeft, (state, { payload }) => {
			const targetTab = getTargetTab(state, payload);

			if (!targetTab)
				return;

			const targetIndex = state.activeTabs.findIndex(t => t.payload === targetTab.payload);

			if (targetIndex === 0)
				return;

			state.activeTabs.splice(0, targetIndex);
		})
		.addCase(actions.closeTabsRight, (state, { payload }) => {
			const targetTab = getTargetTab(state, payload);

			if (!targetTab)
				return;

			const tabCount = state.activeTabs.length;
			const targetIndex = state.activeTabs.findIndex(t => t.payload === targetTab.payload);

			if (targetIndex === tabCount - 1)
				return;

			state.activeTabs.splice(targetIndex + 1, tabCount - targetIndex - 1);
		})
		.addCase(actions.closeTabsOther, (state, { payload }) => {
			const targetTab = getTargetTab(state, payload);

			if (!targetTab)
				return;

			state.activeTabs = [targetTab];
		});
});

function getTargetTab(state: State, tab: TabItem | void) {
	if (!tab)
		return tab;

	const selectedTab = state.selectedTab;

	if (!selectedTab)
		return void 0;

	return state.activeTabs.find(t => t.payload === tab.payload);
}

function updateRecentlyClosed(state: State, ...tabs: TabItem[]) {
	state.recentlyClosedTabs.unshift(...tabs);
	state.recentlyClosedTabs.length = 10;
}

export default tabsReducer;
