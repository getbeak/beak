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
			const existingIndex = state.activeTabs.findIndex(t => t.payload === payload.payload);

			if (existingIndex === -1) {
				state.activeTabs = state.activeTabs.filter(t => !t.temporary);
				state.activeTabs.push(payload);
			}

			state.selectedTab = payload.payload;
		})
		.addCase(actions.changeTabNext, (state, { payload }) => {
			const targetTab = getTargetTab(state, payload);

			if (!targetTab)
				return;

			const targetIndex = state.activeTabs.findIndex(t => t.payload === targetTab.payload);
			const nextIndex = movePosition(state.activeTabs, targetIndex, 'forward');

			state.selectedTab = state.activeTabs[nextIndex].payload;
		})
		.addCase(actions.changeTabPrevious, (state, { payload }) => {
			const targetTab = getTargetTab(state, payload);

			if (!targetTab)
				return;

			const targetIndex = state.activeTabs.findIndex(t => t.payload === targetTab.payload);
			const nextIndex = movePosition(state.activeTabs, targetIndex, 'backward');

			state.selectedTab = state.activeTabs[nextIndex].payload;
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
			state.selectedTab = targetTab.payload;
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
			state.selectedTab = targetTab.payload;
		})
		.addCase(actions.closeTabsOther, (state, { payload }) => {
			const targetTab = getTargetTab(state, payload);

			if (!targetTab)
				return;

			state.activeTabs = [targetTab];
			state.selectedTab = targetTab.payload;
		})

		.addCase(actions.reconciliationComplete, state => {
			state.lastReconcile = Date.now();
		});
});

function getTargetTab(state: State, tab: string | undefined) {
	const selectedTab = tab ?? state.selectedTab;

	if (!selectedTab)
		return void 0;

	return state.activeTabs.find(t => t.payload === selectedTab);
}

function updateRecentlyClosed(state: State, ...tabs: TabItem[]) {
	state.recentlyClosedTabs.unshift(...tabs);
	state.recentlyClosedTabs.length = 10;
}

export default tabsReducer;
