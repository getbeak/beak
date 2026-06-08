import ksuid from '@beak/ksuid';
import {
	insertFolderNode,
	insertProjectInfo,
	insertRequestNode,
	materialiseInMemoryProject,
	type ProjectMode,
	projectLoadFailed,
	projectOpened,
	renameProject,
} from '@beak/state/project';
import { changeTab, closeTab, loadTabState } from '@beak/ui/features/tabs/store/actions';
import {
	handleNodeUpdate,
	loadProject,
	persistPrimaryCookieJar,
	persistProjectName,
	runCreateNewFolder,
	runCreateNewRequest,
	runDuplicateRequest,
	runMoveNode,
	runRelinkRequest,
	runReloadStaleRequest,
	runRemoveNode,
	runRenameSubmitted,
	runUnlinkAndRename,
	startTreeWatcher,
} from '@beak/ui/services/project';
import type { AppStartListening } from '../listener';
import * as projectActions from '../project/actions';
import {
	createNewFolder,
	createNewRequest,
	duplicateRequest,
	moveNodeOnDisk,
	removeNodeFromDisk,
	renameSubmitted,
	revealRequestExternal,
} from '../project/actions';
import { startVariableSets } from '../variable-sets/actions';
import { startWorkflows } from '../workflows/actions';
import { ensureEncryptionAlert, handleTreeEvent } from './project/tree-events';

function selectMode(api: { getState: () => { global: { project: { mode: ProjectMode } } } }): ProjectMode {
	return api.getState().global.project.mode;
}

function ensureMaterialised(api: {
	getState: () => { global: { project: { mode: ProjectMode } } };
	dispatch: (a: unknown) => unknown;
}): ProjectMode {
	const mode = selectMode(api);
	if (mode !== 'none') return mode;
	api.dispatch(
		materialiseInMemoryProject({
			id: ksuid.generate('project').toString(),
			name: 'Untitled',
		}),
	);
	return 'memory';
}

export function registerProjectEffects(start: AppStartListening) {
	// startProject: orchestrate load via services/project, wire tree watcher and encryption alert.
	start({
		actionCreator: projectActions.startProject,
		effect: async (_action, api) => {
			const result = await loadProject();
			if (result.kind === 'error') {
				api.dispatch(projectLoadFailed({ error: result.error.serialize() }));
				return;
			}
			const { info, tree } = result.value;
			api.dispatch(insertProjectInfo(info));
			api.dispatch(startVariableSets());
			api.dispatch(startWorkflows());
			api.dispatch(projectOpened({ tree }));
			api.dispatch(loadTabState());
			await ensureEncryptionAlert(api);
			void startTreeWatcher(event => handleTreeEvent(api, event));
		},
	});

	// Catch node updates and persist them with a 500ms write debounce.
	const nodeUpdateActions = [
		projectActions.requestUriUpdated,
		projectActions.requestQueryAdded,
		projectActions.requestQueryUpdated,
		projectActions.requestQueryRemoved,
		projectActions.requestHeaderAdded,
		projectActions.requestHeaderUpdated,
		projectActions.requestHeaderRemoved,
		projectActions.requestPathParameterValueUpdated,
		projectActions.requestBodyTypeChanged,
		projectActions.requestBodyTextChanged,
		projectActions.requestBodyFileChanged,
		projectActions.requestBodyJsonEditorNameChange,
		projectActions.requestBodyJsonEditorTypeChange,
		projectActions.requestBodyJsonEditorValueChange,
		projectActions.requestBodyJsonEditorEnabledChange,
		projectActions.requestBodyJsonEditorAddEntry,
		projectActions.requestBodyJsonEditorRemoveEntry,
		projectActions.requestBodyGraphQlEditorQueryChanged,
		projectActions.requestBodyGraphQlEditorNameChange,
		projectActions.requestBodyGraphQlEditorValueChange,
		projectActions.requestBodyGraphQlEditorTypeChange,
		projectActions.requestBodyGraphQlEditorEnabledChange,
		projectActions.requestBodyGraphQlEditorAddEntry,
		projectActions.requestBodyGraphQlEditorRemoveEntry,
		projectActions.requestBodyUrlEncodedEditorNameChange,
		projectActions.requestBodyUrlEncodedEditorValueChange,
		projectActions.requestBodyUrlEncodedEditorAddItem,
		projectActions.requestBodyUrlEncodedEditorRemoveItem,
		projectActions.requestBodyUrlEncodedEditorEnabledChange,
		projectActions.requestOptionFollowRedirects,
		projectActions.requestOptionSendCookies,
		projectActions.requestOptionToggleAdditionalCookieJar,
	];
	for (const ac of nodeUpdateActions) {
		start({
			actionCreator: ac,
			effect: async ({ payload }, api) => {
				await handleNodeUpdate((payload as { requestId: string }).requestId, api);
			},
		});
	}

	start({
		actionCreator: createNewFolder,
		effect: async ({ payload }, api) => {
			const mode = ensureMaterialised(api);
			await runCreateNewFolder(payload, api, mode);
		},
	});

	start({
		actionCreator: createNewRequest,
		effect: async ({ payload }, api) => {
			const mode = ensureMaterialised(api);
			await runCreateNewRequest(payload, api, mode);
		},
	});

	start({
		actionCreator: duplicateRequest,
		effect: async ({ payload }, api) => {
			await runDuplicateRequest(payload, api);
		},
	});

	start({
		actionCreator: moveNodeOnDisk,
		effect: async ({ payload }, api) => {
			await runMoveNode(payload, api);
		},
	});

	start({
		actionCreator: removeNodeFromDisk,
		effect: async ({ payload }, api) => {
			await runRemoveNode(payload, api);
		},
	});

	start({
		actionCreator: renameSubmitted,
		effect: async ({ payload }, api) => {
			await runRenameSubmitted(payload, api);
		},
	});

	start({
		actionCreator: projectActions.unlinkAndRename,
		effect: async ({ payload }, api) => {
			await runUnlinkAndRename(payload.requestId, api);
		},
	});

	// closeTabIntent: routes dirty linked requests to the unlink dialog; everything else closes.
	start({
		actionCreator: projectActions.closeTabIntent,
		effect: async ({ payload }, api) => {
			const tabId = payload ?? api.getState().features.tabs.selectedTab;
			if (!tabId) return;
			const tab = api.getState().features.tabs.activeTabs.find(t => t.payload === tabId);
			if (tab?.type === 'request' && api.getState().global.project.linkedDirty[tabId]) {
				api.dispatch(projectActions.unlinkConfirmShow({ requestId: tabId }));
				return;
			}
			api.dispatch(closeTab(tabId));
		},
	});

	// Focus-on-stale: surface the reconcile prompt on tab switch if stale.
	start({
		actionCreator: changeTab,
		effect: async ({ payload }, api) => {
			if (payload.type !== 'request') return;
			const requestId = payload.payload;
			if (api.getState().global.project.linkedStale[requestId]) {
				api.dispatch(projectActions.staleReloadShow({ requestId }));
			}
		},
	});

	start({
		actionCreator: projectActions.relinkRequest,
		effect: async ({ payload }, api) => {
			await runRelinkRequest(payload.requestId, api);
		},
	});

	start({
		actionCreator: projectActions.reloadStaleRequest,
		effect: async ({ payload }, api) => {
			await runReloadStaleRequest(payload.requestId, api);
		},
	});

	start({
		actionCreator: projectActions.keepLocalStaleRequest,
		effect: async ({ payload }, api) => {
			api.dispatch(projectActions.linkedStaleCleared({ requestId: payload.requestId }));
			api.dispatch(projectActions.staleReloadDismiss());
		},
	});

	start({
		actionCreator: renameProject,
		effect: async ({ payload }, api) => {
			if (selectMode(api) !== 'disk') return;
			try {
				await persistProjectName(payload.name);
			} catch (error) {
				console.warn('rename project persist failed', error);
			}
		},
	});

	start({
		actionCreator: projectActions.setPrimaryCookieJar,
		effect: async ({ payload }, api) => {
			if (selectMode(api) !== 'disk') return;
			try {
				await persistPrimaryCookieJar(payload.variableSet);
			} catch (error) {
				console.warn('primary cookie jar persist failed', error);
			}
		},
	});

	start({
		actionCreator: revealRequestExternal,
		effect: async ({ payload }, api) => {
			for (let i = 0; i < 20; i++) {
				if (!api.getState().global.project.loaded) {
					await api.delay(200);
					continue;
				}
				const tree = api.getState().global.project.tree;
				if (Object.keys(tree).includes(payload)) api.dispatch(changeTab({ type: 'request', payload, temporary: false }));
				return;
			}
		},
	});
}
