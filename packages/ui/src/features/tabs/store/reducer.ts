import type { TabItem } from '@beak/common/types/beak-project';
import { movePosition } from '@beak/ui/utils/arrays';
import { createReducer } from '@reduxjs/toolkit';

import * as actions from './actions';
import { initialState, type State } from './types';

const tabsReducer = createReducer(initialState, builder => {
	builder
		.addCase(actions.tabStateLoaded, (_state, { payload }) => payload)

		.addCase(actions.changeTab, (state, { payload }) => {
			const existingIndex = state.activeTabs.findIndex(t => t.payload === payload.payload);

			if (existingIndex === -1) {
				const evicted = state.activeTabs.filter(t => t.temporary).map(t => t.payload);
				state.activeTabs = state.activeTabs.filter(t => !t.temporary);
				state.activeTabs.push(payload);
				if (evicted.length > 0) state.mruOrder = state.mruOrder.filter(p => !evicted.includes(p));
			}

			state.selectedTab = payload.payload;
			pushMru(state, payload.payload);
		})
		.addCase(actions.changeTabNext, (state, { payload }) => {
			const targetTab = getTargetTab(state, payload);

			if (!targetTab) return;

			const targetIndex = state.activeTabs.findIndex(t => t.payload === targetTab.payload);
			const nextIndex = movePosition(state.activeTabs, targetIndex, 'forward');
			const nextPayload = state.activeTabs[nextIndex].payload;

			state.selectedTab = nextPayload;
			pushMru(state, nextPayload);
		})
		.addCase(actions.changeTabPrevious, (state, { payload }) => {
			const targetTab = getTargetTab(state, payload);

			if (!targetTab) return;

			const targetIndex = state.activeTabs.findIndex(t => t.payload === targetTab.payload);
			const nextIndex = movePosition(state.activeTabs, targetIndex, 'backward');
			const nextPayload = state.activeTabs[nextIndex].payload;

			state.selectedTab = nextPayload;
			pushMru(state, nextPayload);
		})
		.addCase(actions.makeTabPermanent, (state, { payload }) => {
			const targetTab = getTargetTab(state, payload);

			if (!targetTab) return;

			const index = state.activeTabs.findIndex(t => t.payload === targetTab.payload);

			state.activeTabs[index].temporary = false;
		})

		.addCase(actions.closeTab, (state, { payload }) => {
			const targetTab = getTargetTab(state, payload);

			if (!targetTab) return;

			const selectedIsTarget = targetTab.payload === state.selectedTab;
			const targetIndex = state.activeTabs.findIndex(t => t.payload === targetTab.payload);

			state.activeTabs.splice(targetIndex, 1);
			dropMru(state, targetTab.payload);

			updateRecentlyClosed(state, targetTab);

			if (selectedIsTarget) {
				if (state.activeTabs.length === 0) {
					state.selectedTab = void 0;
				} else {
					// Prefer the previous MRU entry over the index-based neighbour
					// — matches the macOS "release Cmd+Tab" intuition where you
					// fall back to where you just came from.
					const nextPayload =
						state.mruOrder[0] ?? state.activeTabs[movePosition(state.activeTabs, targetIndex, 'backward')]?.payload;
					state.selectedTab = nextPayload;
					if (nextPayload) pushMru(state, nextPayload);
				}
			}
		})
		.addCase(actions.closeTabsAll, state => {
			if (state.activeTabs.length === 0) return;

			updateRecentlyClosed(state, ...state.activeTabs);

			state.activeTabs = [];
			state.selectedTab = void 0;
			state.mruOrder = [];
		})
		.addCase(actions.closeTabsLeft, (state, { payload }) => {
			const targetTab = getTargetTab(state, payload);

			if (!targetTab) return;

			const targetIndex = state.activeTabs.findIndex(t => t.payload === targetTab.payload);

			if (targetIndex === 0) return;

			const removed = state.activeTabs.splice(0, targetIndex);
			for (const t of removed) dropMru(state, t.payload);
			state.selectedTab = targetTab.payload;
			pushMru(state, targetTab.payload);
		})
		.addCase(actions.closeTabsRight, (state, { payload }) => {
			const targetTab = getTargetTab(state, payload);

			if (!targetTab) return;

			const tabCount = state.activeTabs.length;
			const targetIndex = state.activeTabs.findIndex(t => t.payload === targetTab.payload);

			if (targetIndex === tabCount - 1) return;

			const removed = state.activeTabs.splice(targetIndex + 1, tabCount - targetIndex - 1);
			for (const t of removed) dropMru(state, t.payload);
			state.selectedTab = targetTab.payload;
			pushMru(state, targetTab.payload);
		})
		.addCase(actions.closeTabsOther, (state, { payload }) => {
			const targetTab = getTargetTab(state, payload);

			if (!targetTab) return;

			state.activeTabs = [targetTab];
			state.selectedTab = targetTab.payload;
			state.mruOrder = [targetTab.payload];
		})

		.addCase(actions.reconciliationComplete, state => {
			state.lastReconcile = Date.now();
		});
});

function getTargetTab(state: State, tab: string | undefined) {
	const selectedTab = tab ?? state.selectedTab;

	if (!selectedTab) return void 0;

	return state.activeTabs.find(t => t.payload === selectedTab);
}

function updateRecentlyClosed(state: State, ...tabs: TabItem[]) {
	state.recentlyClosedTabs.unshift(...tabs);
	// Cap at 10. Setting .length = 10 unconditionally would pad with holes
	// when fewer than 10 tabs have been closed in this session.
	if (state.recentlyClosedTabs.length > 10) state.recentlyClosedTabs.length = 10;
}

function pushMru(state: State, payload: string) {
	const existing = state.mruOrder.indexOf(payload);
	if (existing !== -1) state.mruOrder.splice(existing, 1);
	state.mruOrder.unshift(payload);
}

function dropMru(state: State, payload: string) {
	const existing = state.mruOrder.indexOf(payload);
	if (existing !== -1) state.mruOrder.splice(existing, 1);
}

export default tabsReducer;
