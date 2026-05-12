import { TypedObject } from '@beak/common/helpers/typescript';
import type { TabPreferences } from '@beak/common/types/beak-hub';
import Squawk from '@beak/common/utils/squawk';
import { readJsonAndValidate } from '@beak/ui/lib/fs';
import { ipcFsService } from '@beak/ui/lib/ipc';
import path from 'path-browserify';
import * as tabActions from '../../features/tabs/store/actions';
import {
	attemptReconciliation,
	closeTab,
	loadTabState,
	reconciliationComplete,
} from '../../features/tabs/store/actions';
import { tabPreferences } from '../../lib/beak-hub/schemas';
import type { AppStartListening } from '../listener';

export function registerTabsEffects(start: AppStartListening) {
	// Persist tab state on any tab-changing action.
	const tabChangeActions = [
		tabActions.changeTab,
		tabActions.changeTabNext,
		tabActions.changeTabPrevious,
		tabActions.closeTab,
		tabActions.closeTabsAll,
		tabActions.closeTabsLeft,
		tabActions.closeTabsOther,
		tabActions.closeTabsRight,
		tabActions.makeTabPermanent,
	];
	for (const ac of tabChangeActions) {
		start({
			actionCreator: ac,
			effect: async (_action, api) => {
				const state = api.getState().features.tabs;
				if (!state) return;

				const preferences: TabPreferences = {
					tabs: state.activeTabs,
					selectedTabPayload: state.selectedTab,
				};
				await ipcFsService.writeJson(path.join('.beak', 'preferences', 'tab-state.json'), preferences);
			},
		});
	}

	// Load tab state from disk (dispatched at startup once project is loaded).
	start({
		actionCreator: loadTabState,
		effect: async (_action, api) => {
			try {
				const tabState = await loadTabStateFile();
				if (tabState !== null) {
					api.dispatch(
						tabActions.tabStateLoaded({
							selectedTab: tabState.selectedTabPayload,
							activeTabs: tabState.tabs,
							recentlyClosedTabs: [],
							lastReconcile: 0,
							loaded: true,
						}),
					);
					api.dispatch(attemptReconciliation());
					return;
				}
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error(error);
			}

			api.dispatch(
				tabActions.tabStateLoaded({
					selectedTab: 'new_project_intro',
					activeTabs: [{ type: 'new_project_intro', temporary: false, payload: 'new_project_intro' }],
					recentlyClosedTabs: [],
					lastReconcile: 0,
					loaded: true,
				}),
			);
		},
	});

	// Reconcile open tabs against the current tree (close tabs for removed nodes).
	start({
		actionCreator: attemptReconciliation,
		effect: async (_action, api) => {
			// Dirty hack: wait for any pending unlink→add (rename) to settle.
			await api.delay(100);

			const tabs = api.getState().features.tabs.activeTabs;
			const tree = api.getState().global.project.tree;
			const variableGroups = api.getState().global.variableGroups.variableGroups;

			const nodes = TypedObject.values(tree);
			const variableGroupNames = TypedObject.keys(variableGroups);

			for (const tab of tabs) {
				switch (tab.type) {
					case 'request': {
						const node = nodes.find(n => n.id === tab.payload);
						if (!node) api.dispatch(closeTab(tab.payload));
						break;
					}
					case 'variable_group_editor': {
						const variableGroup = variableGroupNames.find(n => n === tab.payload);
						if (!variableGroup) api.dispatch(closeTab(tab.payload));
						break;
					}
					case 'new_project_intro':
						break;
					default:
						api.dispatch(closeTab((tab as { payload: string }).payload));
				}
			}

			api.dispatch(reconciliationComplete());
		},
	});
}

async function loadTabStateFile() {
	const preferencesPath = path.join('.beak', 'preferences', 'tab-state.json');

	if (!(await ipcFsService.pathExists(preferencesPath))) return null;

	try {
		const preferenceFile = await readJsonAndValidate<TabPreferences>(preferencesPath, tabPreferences);
		return preferenceFile.file;
	} catch (error) {
		if (Squawk.coerce(error).code !== 'schema_invalid') throw error;
		return null;
	}
}
