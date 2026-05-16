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
				// Tab state persists per-project under .beak/preferences/. With
				// no project on disk there's nowhere to write — ephemeral tabs
				// in memory mode get persisted alongside the project on Save.
				if (api.getState().global.project.mode !== 'disk') return;

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
			const variableSets = api.getState().global.variableSets.variableSets;

			const nodes = TypedObject.values(tree);
			const variableGroupNames = TypedObject.keys(variableSets) as string[];

			for (const tab of tabs) {
				switch (tab.type) {
					case 'request': {
						const node = nodes.find(n => n.id === tab.payload);
						if (!node) api.dispatch(closeTab(tab.payload));
						break;
					}
					case 'variable_set_editor': {
						const variableGroup = variableGroupNames.find(n => n === tab.payload);
						if (!variableGroup) api.dispatch(closeTab(tab.payload));
						break;
					}
					case 'new_project_intro':
					case 'preferences':
					case 'variable_input_playground':
						// Project-window-scoped singletons, not tied to tree/variable-set
						// state, so reconciliation should leave them alone.
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
