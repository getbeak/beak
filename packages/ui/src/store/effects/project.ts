import ksuid from '@beak/ksuid';
import { provenance } from '@beak/state';
import {
	insertFolderNode,
	insertProjectInfo,
	insertRequestNode,
	materialiseInMemoryProject,
	moveNodeInTree,
	type ProjectMode,
	projectLoadFailed,
	projectOpened,
	removeNodeFromStore,
	renameNodeInTree,
	renameProject,
	startProject,
} from '@beak/state/project';
import {
	attemptReconciliation,
	changeTab,
	closeTab,
	loadTabState,
	makeTabPermanent,
} from '@beak/ui/features/tabs/store/actions';
import type { ActiveRename } from '@beak/ui/features/tree-view/types';
import { createFolderNode, removeFolderNode, renameFolderNode } from '@beak/ui/lib/beak-project/folder';
import { moveNodesOnDisk } from '@beak/ui/lib/beak-project/nodes';
import { readProjectFile } from '@beak/ui/lib/beak-project/project';
import {
	createRequestNode,
	duplicateRequestNode,
	readRequestNode,
	removeRequestNode,
	renameRequestNode,
	unlinkAndPersistAs,
	writeRequestNode,
} from '@beak/ui/lib/beak-project/request';
import { ipcDialogService, ipcFsService } from '@beak/ui/lib/ipc';
import { loadProject, registerFolderRename, registerRequestRename, startTreeWatcher } from '@beak/ui/services/project';
import type { FolderNode, RequestNode, Tree } from '@getbeak/types/nodes';
import path from 'path-browserify';
import * as uuid from 'uuid';
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
import * as workflowActions from '../workflows/actions';
import { startWorkflows, updateWorkflowName } from '../workflows/actions';
import { ensureEncryptionAlert, handleTreeEvent } from './project/tree-events';

/**
 * Walk a tree rooted at `nodeId` and return every request node id under it
 * (the node itself if it's a request). Folders don't appear; the workflow
 * cleanup only cares about request refs.
 */
function collectRequestIdsUnder(tree: Tree, nodeId: string): string[] {
	const start = tree[nodeId];
	if (!start) return [];
	if (start.type === 'request') return [start.id];
	if (start.type !== 'folder') return [];
	const out: string[] = [];
	const stack: string[] = [start.id];
	while (stack.length > 0) {
		const cur = stack.pop()!;
		for (const node of Object.values(tree)) {
			if (node.parent !== cur) continue;
			if (node.type === 'request') out.push(node.id);
			else if (node.type === 'folder') stack.push(node.id);
		}
	}
	return out;
}

function selectMode(api: { getState: () => { global: { project: { mode: ProjectMode } } } }): ProjectMode {
	return api.getState().global.project.mode;
}

/**
 * Promote an empty workbench to an in-memory scratch project. Called as
 * the first thing inside any tree-mutating effect — once the user takes
 * a real action from the welcome tab, we have a project. The id is a
 * fresh ksuid; the user can rename via Save Project As later.
 */
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
	// startProject: orchestrate the load via ProjectLoaderService, then wire
	// the long-running tree watcher and the encryption alert. The effect
	// stays thin — domain logic lives in `services/project/`.
	start({
		actionCreator: startProject,
		effect: async (_action, api) => {
			const result = await loadProject();

			if (result.kind === 'error') {
				// Surface the failure in-page (instead of closing the window)
				// so the user can read the squawk, fix the underlying file,
				// and dispatch startProject again.
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

			// Long-running fs subscription. Lives for the life of the project
			// window — it's not unsubscribed because the project is open for the
			// window's entire lifetime.
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
				// Memory-mode projects keep redux as the only source of truth —
				// the body editor's keystrokes never hit disk until Save Project
				// As. Skip the debounce + write entirely.
				if (selectMode(api) !== 'disk') return;

				const requestId = (payload as { requestId: string }).requestId;
				let node = api.getState().global.project.tree[requestId];
				if (!node || node.type !== 'request') return;

				// Linked (spec-generated) request files are read-only on disk:
				// the user must explicitly unlink (close-tab dialog → rename) for
				// edits to persist. Until then the edit lives in redux state with
				// a dirty flag; the project effect skips the debounced write.
				if (node.mode === 'valid' && provenance.isLinked(node.info)) {
					if (!api.getState().global.project.linkedDirty[requestId]) {
						api.dispatch(projectActions.linkedDirtyMarked({ requestId }));
					}
					return;
				}

				const nonce = uuid.v4();
				api.dispatch(projectActions.setWriteDebounce({ requestId, nonce }));
				await api.delay(500);

				const debounce = api.getState().global.project.writeDebouncer[requestId];
				if (debounce !== nonce) return;

				node = api.getState().global.project.tree[requestId];
				api.dispatch(projectActions.setLatestWrite({ filePath: node.filePath, writtenAt: Date.now() }));
				await writeRequestNode(node as RequestNode);
			},
		});
	}

	// Create new folder / request — in disk mode, this writes to fs and waits
	// for the watcher to fold the new node into the tree (so we can start the
	// rename UI on it). In memory / none mode, we synthesise the node inline
	// and dispatch insert directly; no watcher round-trip exists.
	start({
		actionCreator: createNewFolder,
		effect: async ({ payload }, api) => {
			const mode = ensureMaterialised(api);
			const parentNode = payload.highlightedNodeId
				? api.getState().global.project.tree[payload.highlightedNodeId]
				: undefined;

			let directory = 'tree/';
			if (parentNode) directory = parentNode.type === 'folder' ? parentNode.filePath : path.dirname(parentNode.filePath);

			if (mode !== 'disk') {
				const name = payload.name ?? 'New folder';
				const filePath = path.join(directory, name);
				const folder: FolderNode = {
					id: filePath,
					type: 'folder',
					name,
					filePath,
					parent: directory,
				};
				api.dispatch(insertFolderNode(folder));
				api.dispatch(projectActions.renameStarted({ requestId: filePath }));
				return;
			}

			const resolvedPath = await createFolderNode(directory, payload.name);

			await api.take(insertFolderNode.match, 250);
			api.dispatch(projectActions.renameStarted({ requestId: resolvedPath }));
		},
	});
	start({
		actionCreator: createNewRequest,
		effect: async ({ payload }, api) => {
			const mode = ensureMaterialised(api);
			const parentNode = payload.highlightedNodeId
				? api.getState().global.project.tree[payload.highlightedNodeId]
				: undefined;

			let directory = 'tree/';
			if (parentNode) directory = parentNode.type === 'folder' ? parentNode.filePath : path.dirname(parentNode.filePath);

			if (mode !== 'disk') {
				const id = ksuid.generate('request').toString();
				const name = payload.name ?? 'New request';
				const filePath = path.join(directory, `${name}.json`);
				const node: RequestNode = {
					id,
					type: 'request',
					mode: 'valid',
					name,
					filePath,
					parent: directory,
					info: {
						verb: 'get',
						url: ['https://httpbin.org/anything'],
						query: {},
						headers: {},
						body: { type: 'text', payload: '' },
						options: {
							followRedirects: false,
							decompressResponse: true,
							timeoutMs: 0,
							maxRedirects: 5,
						},
					},
				};
				api.dispatch(insertRequestNode(node));
				api.dispatch(changeTab({ type: 'request', payload: id, temporary: true }));
				api.dispatch(projectActions.renameStarted({ requestId: id }));
				return;
			}

			const nodeId = await createRequestNode(directory, payload.name);

			await api.take(insertRequestNode.match, 250);
			api.dispatch(changeTab({ type: 'request', payload: nodeId, temporary: true }));
			api.dispatch(projectActions.renameStarted({ requestId: nodeId }));
		},
	});

	// Duplicate request.
	start({
		actionCreator: duplicateRequest,
		effect: async ({ payload }, api) => {
			const node = api.getState().global.project.tree[payload.requestId];
			if (!node || node.type !== 'request') return;

			if (selectMode(api) !== 'disk') {
				if (node.mode !== 'valid') return; // can't duplicate a broken request
				const id = ksuid.generate('request').toString();
				const name = `${node.name} copy`;
				const filePath = path.join(path.dirname(node.filePath), `${name}.json`);
				const cloned: RequestNode = {
					...node,
					id,
					name,
					filePath,
					info: structuredClone(node.info),
				};
				api.dispatch(insertRequestNode(cloned));
				api.dispatch(changeTab({ type: 'request', payload: id, temporary: true }));
				return;
			}

			const newNodeId = await duplicateRequestNode(node);

			if (!newNodeId) {
				await ipcDialogService.showMessageBox({
					type: 'error',
					title: 'Unable to duplicate broken request',
					message: 'You can’t duplicate a request which has validation errors. Once they are fixed please try again.',
					detail: 'Message @beakapp on twitter for support.',
				});
				return;
			}

			await api.take(insertRequestNode.match, 250);
			api.dispatch(changeTab({ type: 'request', payload: newNodeId, temporary: true }));
		},
	});

	// Move node on disk.
	start({
		actionCreator: moveNodeOnDisk,
		effect: async ({ payload }, api) => {
			const tree = api.getState().global.project.tree;
			const sourceNode = tree[payload.sourceNodeId];
			const destinationNode = tree[payload.destinationNodeId];
			const tabs = api.getState().features.tabs.activeTabs;
			const openedTab = tabs.find(t => t.type === 'request' && t.payload === sourceNode?.id);

			if (!sourceNode) return;
			if (!destinationNode && payload.destinationNodeId !== 'root') return;

			if (selectMode(api) !== 'disk') {
				// Memory-mode move: rewrite the source's filePath/parent in
				// redux. Folders re-key + carry their descendants under the
				// new path; requests just reseat under the new parent.
				const destinationFolderPath = !destinationNode
					? 'tree'
					: destinationNode.type === 'folder'
						? destinationNode.filePath
						: (destinationNode.parent ?? 'tree');
				api.dispatch(
					moveNodeInTree({
						nodeId: payload.sourceNodeId,
						destinationFolderPath,
					}),
				);

				if (openedTab) {
					api.dispatch(makeTabPermanent(openedTab.payload));
				}
				return;
			}

			await moveNodesOnDisk(sourceNode, destinationNode);

			if (!openedTab) return;

			await api.delay(300);
			api.dispatch(changeTab({ type: 'request', payload: openedTab.payload, temporary: false }));
			api.dispatch(makeTabPermanent(openedTab.payload));
		},
	});

	// Remove node from disk (with optional confirm).
	start({
		actionCreator: removeNodeFromDisk,
		effect: async ({ payload }, api) => {
			const { requestId, withConfirmation } = payload;
			const node = api.getState().global.project.tree[requestId];
			if (!node) return;

			const mode = selectMode(api);

			if (mode === 'disk' && withConfirmation) {
				// Disk projects warn the user — the action is irreversible.
				// Memory projects skip the warning since "delete" only removes
				// from redux; nothing has been written to disk yet.
				const response = await ipcDialogService.showMessageBox({
					title: 'Delete file or folder',
					message: `You are about to delete “${node.name}” from your machine. Are you sure you want to continue?`,
					detail: 'This action is irreversible inside Beak!',
					type: 'warning',
					buttons: ['Remove', 'Cancel'],
					defaultId: 1,
					cancelId: 1,
				});
				if (response.response === 1) return;
			}

			// Collect every request id that's about to disappear — the node
			// itself if it's a request, plus every request descendant if
			// it's a folder — so we can later notify workflows to drop
			// dangling references. (Captured *before* mutating the tree.)
			const tree = api.getState().global.project.tree;
			const droppedRequestIds = collectRequestIdsUnder(tree, requestId);

			if (mode === 'disk') {
				if (node.type === 'folder') await removeFolderNode(node.filePath);
				else if (node.type === 'request') await removeRequestNode(node.filePath);
			}

			api.dispatch(removeNodeFromStore(requestId));
			api.dispatch(attemptReconciliation());
			if (droppedRequestIds.length > 0) {
				api.dispatch(workflowActions.purgeRequestRefs({ requestIds: droppedRequestIds }));
			}
		},
	});

	// Rename node.
	start({
		actionCreator: renameSubmitted,
		effect: async ({ payload }, api) => {
			const activeRename = api.getState().global.project.activeRename as ActiveRename | undefined;
			const node = api.getState().global.project.tree[payload.requestId];

			if (!activeRename || activeRename.id !== payload.requestId) return;

			// Workflows aren't in the project tree — they're synthesised into the
			// merged tree by the project pane from the workflows slice. The rename
			// UI shares the same `activeRename` slot, so we route the submit to
			// `updateWorkflowName` (debounced effect writes the file).
			if (!node) {
				const workflow = api.getState().global.workflows.workflows[payload.requestId];
				if (!workflow) return;

				if (activeRename.name !== workflow.name) {
					api.dispatch(updateWorkflowName({ id: payload.requestId, name: activeRename.name }));
				}
				api.dispatch(projectActions.renameResolved({ requestId: payload.requestId }));
				return;
			}

			if (activeRename.name === node.name) {
				api.dispatch(projectActions.renameResolved({ requestId: payload.requestId }));
				return;
			}

			// Memory-mode rename: just patch the node's name in redux. Folder
			// `filePath` (and child paths) stay synthetic — they're regenerated
			// when the project is saved to disk.
			if (selectMode(api) !== 'disk') {
				api.dispatch(renameNodeInTree({ nodeId: payload.requestId, name: activeRename.name }));
				api.dispatch(projectActions.renameResolved({ requestId: payload.requestId }));
				return;
			}

			if (node.type === 'request') {
				try {
					const oldPath = node.filePath;
					const newPath = path.join(path.dirname(oldPath), `${activeRename.name}${path.extname(oldPath)}`);

					// Suppress the unlink(old) + add(new) the fs-watcher is
					// about to emit, then optimistically rewrite the tree.
					// The tab stays mounted because its backing node never
					// leaves the store.
					registerRequestRename(oldPath, newPath);
					api.dispatch(renameNodeInTree({ nodeId: payload.requestId, name: activeRename.name }));

					await renameRequestNode(activeRename.name, node as RequestNode);
					api.dispatch(projectActions.renameResolved({ requestId: payload.requestId }));
					api.dispatch(changeTab({ type: 'request', temporary: false, payload: node.id }));
				} catch (error) {
					if (error instanceof Error && error.message === 'Request already exists') {
						await ipcDialogService.showMessageBox({
							title: 'Already exists!',
							message: 'The file name you specified already exists, please try something else.',
							type: 'info',
						});
						return;
					}
					await ipcDialogService.showMessageBox({
						title: 'Rename unsuccessful',
						message: 'There was an unknown error while attempting to rename this file',
						type: 'error',
					});
				}
			} else if (node.type === 'folder') {
				try {
					const oldPath = node.filePath;
					const newPath = path.join(path.dirname(oldPath), activeRename.name);

					// Folder rename fans out to every descendant: each file
					// inside reports unlink+add at its old/new path, plus
					// the folder itself and any nested folders. Register
					// all of them (exact + prefix) before the move so the
					// tree-event handler can drop the whole burst.
					registerFolderRename(api.getState().global.project.tree as Tree, oldPath, newPath);
					api.dispatch(renameNodeInTree({ nodeId: payload.requestId, name: activeRename.name }));

					await renameFolderNode(activeRename.name, node as FolderNode);
					api.dispatch(projectActions.renameResolved({ requestId: payload.requestId }));
				} catch (error) {
					if (error instanceof Error && error.message === 'Folder already exists') {
						await ipcDialogService.showMessageBox({
							title: 'Already exists!',
							message: 'The folder name you specified already exists, please try something else.',
							type: 'info',
						});
						return;
					}
					await ipcDialogService.showMessageBox({
						title: 'Rename unsuccessful',
						message: 'There was an unknown error while attempting to rename this folder',
						type: 'error',
					});
				}
			}
		},
	});

	// Unlink + rename: persist the user's in-memory edits to a new file (with
	// `_provenance.linked: false`), close the original tab, and clear the
	// dirty flag. The original on-disk file is left alone so the next re-sync
	// repopulates it cleanly.
	start({
		actionCreator: projectActions.unlinkAndRename,
		effect: async ({ payload }, api) => {
			const node = api.getState().global.project.tree[payload.requestId];
			if (!node || node.type !== 'request' || node.mode !== 'valid') return;

			try {
				const persisted = await unlinkAndPersistAs(node);
				if (!persisted) return;
				api.dispatch(projectActions.linkedDirtyCleared({ requestId: payload.requestId }));
				api.dispatch(projectActions.unlinkConfirmDismiss());
				api.dispatch(closeTab(payload.requestId));
			} catch (error) {
				if (!(error instanceof Error)) return;
				await ipcDialogService.showMessageBox({
					type: 'error',
					title: 'Unlink failed',
					message: 'We couldn’t persist your edits to a new file.',
					detail: [error.message, error.stack].join('\n'),
				});
			}
		},
	});

	// closeTabIntent — UI-side close requests pass through this gate so dirty
	// linked requests can prompt before they vanish. Everything else closes
	// directly via the existing `closeTab` reducer path.
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

	// Focus-on-stale: when the user switches to a tab whose request was
	// clobbered by an external change (re-sync, manual edit, git pull),
	// surface the reconcile prompt instead of silently presenting whichever
	// version they happen to have in memory.
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

	// Re-link: discard in-memory edits and re-read the on-disk (spec) version.
	start({
		actionCreator: projectActions.relinkRequest,
		effect: async ({ payload }, api) => {
			const node = api.getState().global.project.tree[payload.requestId];
			if (!node || node.type !== 'request') return;

			const refreshed = await readRequestNode(node.filePath);
			api.dispatch(insertRequestNode(refreshed));
			api.dispatch(projectActions.linkedDirtyCleared({ requestId: payload.requestId }));
			api.dispatch(projectActions.linkedStaleCleared({ requestId: payload.requestId }));
		},
	});

	// Stale reload: re-read from disk + clear flags. Same effect as relink
	// when the user has no dirty edits; the distinct action exists so the
	// reload dialog tracks separately from the close-tab dialog.
	start({
		actionCreator: projectActions.reloadStaleRequest,
		effect: async ({ payload }, api) => {
			const node = api.getState().global.project.tree[payload.requestId];
			if (!node || node.type !== 'request') return;

			const refreshed = await readRequestNode(node.filePath);
			api.dispatch(insertRequestNode(refreshed));
			api.dispatch(projectActions.linkedDirtyCleared({ requestId: payload.requestId }));
			api.dispatch(projectActions.linkedStaleCleared({ requestId: payload.requestId }));
			api.dispatch(projectActions.staleReloadDismiss());
		},
	});

	// "Keep my version": just clear the stale flag. Edits stay in-memory; on
	// the next re-sync, this fires again. The user has to commit (unlink) to
	// stop seeing it.
	start({
		actionCreator: projectActions.keepLocalStaleRequest,
		effect: async ({ payload }, api) => {
			api.dispatch(projectActions.linkedStaleCleared({ requestId: payload.requestId }));
			api.dispatch(projectActions.staleReloadDismiss());
		},
	});

	// Rename project: in disk mode, the slice has already applied the new
	// name; here we round-trip `project.json` so the change survives
	// refresh. Memory-mode projects keep the rename in redux until Save
	// Project As.
	start({
		actionCreator: renameProject,
		effect: async ({ payload }, api) => {
			if (selectMode(api) !== 'disk') return;
			try {
				const projectFile = await readProjectFile();
				if (projectFile.name === payload.name) return;
				await ipcFsService.writeJson('project.json', { ...projectFile, name: payload.name });
			} catch (error) {
				console.warn('rename project persist failed', error);
			}
		},
	});

	// Set primary cookie jar: same shape as renameProject — slice is already
	// up to date by the time this runs; we round-trip project.json so the
	// `cookies.primaryVariableSet` field survives refresh.
	start({
		actionCreator: projectActions.setPrimaryCookieJar,
		effect: async ({ payload }, api) => {
			if (selectMode(api) !== 'disk') return;
			try {
				const projectFile = await readProjectFile();
				if (projectFile.cookies?.primaryVariableSet === payload.variableSet) return;
				await ipcFsService.writeJson('project.json', {
					...projectFile,
					cookies: { ...(projectFile.cookies ?? {}), primaryVariableSet: payload.variableSet },
				});
			} catch (error) {
				console.warn('primary cookie jar persist failed', error);
			}
		},
	});

	// External reveal-request request: poll until the project tree contains it.
	start({
		actionCreator: revealRequestExternal,
		effect: async ({ payload }, api) => {
			for (let i = 0; i < 20; i++) {
				const loaded = api.getState().global.project.loaded;
				if (!loaded) {
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
