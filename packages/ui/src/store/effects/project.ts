import Squawk from '@beak/common/utils/squawk';
import {
	insertFolderNode,
	insertProjectInfo,
	insertRequestNode,
	projectOpened,
	removeNodeFromStore,
	removeNodeFromStoreByPath,
	startProject,
} from '@beak/state/project';
import ksuid from '@beak/ksuid';
import {
	attemptReconciliation,
	changeTab,
	closeTab,
	loadTabState,
	makeTabPermanent,
} from '@beak/ui/features/tabs/store/actions';
import type { ActiveRename } from '@beak/ui/features/tree-view/types';
import { createFolderNode, readFolderNode, removeFolderNode, renameFolderNode } from '@beak/ui/lib/beak-project/folder';
import { moveNodesOnDisk } from '@beak/ui/lib/beak-project/nodes';
import { readProjectFile } from '@beak/ui/lib/beak-project/project';
import {
	createRequestNode,
	duplicateRequestNode,
	readRequestNode,
	removeRequestNode,
	renameRequestNode,
	writeRequestNode,
} from '@beak/ui/lib/beak-project/request';
import createFsEmitter, { scanDirectoryRecursively } from '@beak/ui/lib/fs-emitter';
import { ipcDialogService, ipcEncryptionService, ipcWindowService } from '@beak/ui/lib/ipc';
import type { FolderNode, RequestNode, Tree } from '@getbeak/types/nodes';
import type { ProjectFile } from '@getbeak/types/project';
import path from 'path-browserify';
import * as uuid from 'uuid';
import type { AppStartListening } from '../listener';
import * as projectActions from '../project/actions';
import {
	alertInsert,
	createNewFolder,
	createNewRequest,
	duplicateRequest,
	moveNodeOnDisk,
	removeNodeFromDisk,
	renameSubmitted,
	revealRequestExternal,
} from '../project/actions';
import { startVariableSets } from '../variable-sets/actions';

export function registerProjectEffects(start: AppStartListening) {
	// startProject: read project metadata, kick off variable groups, do the initial tree
	// import, then start watching the tree folder for changes.
	start({
		actionCreator: startProject,
		effect: async (_action, api) => {
			let project: ProjectFile;

			try {
				project = await readProjectFile();
				api.dispatch(insertProjectInfo({ id: project.id, name: project.name, untitled: project.untitled }));
				api.dispatch(startVariableSets());
				await initialImport(api, 'tree');
				api.dispatch(loadTabState());
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === 'Legacy project detected') {
						await ipcDialogService.showMessageBox({
							type: 'warning',
							title: 'Unsupported project version',
							message: 'The project you opened is no longer supported by Beak, it should have been automatically updated.',
							detail: 'Message @beakapp on twitter for support.',
						});
					} else if (error.message === 'Future project detected') {
						await ipcDialogService.showMessageBox({
							type: 'warning',
							title: 'Unsupported project version',
							message:
								'The project you opened can’t be opened by this version of Beak. Please check for updates and try again.',
							detail: 'Message @beakapp on twitter for support.',
						});
					}
				}

				const squawk = Squawk.coerce(error);
				await ipcDialogService.showMessageBox({
					type: 'error',
					title: 'Project failed to open',
					message: 'There was a problem loading the Beak project.',
					detail: [squawk.message, squawk.stack].join('\n'),
				});

				await ipcWindowService.closeSelfWindow();
				return;
			}

			const encryptionStatus = await ipcEncryptionService.checkStatus();
			if (!encryptionStatus) {
				api.dispatch(
					alertInsert({
						ident: ksuid.generate('alert').toString(),
						alert: { type: 'missing_encryption' },
					}),
				);
			}

			// Long-running fs subscription. Lives for the life of the project window
			// — it's not unsubscribed because the project is open for the window's
			// entire lifetime.
			const subscription = createFsEmitter(
				'tree',
				async event => {
					const isDirectory = ['addDir', 'unlinkDir'].includes(event.type);

					if (!isDirectory && path.extname(event.path) !== '.json') return;

					try {
						if (isDirectory) {
							if (event.type === 'addDir') {
								const node = await readFolderNode(event.path);
								const existingNode = api.getState().global.project.tree[node.id];
								if (existingNode) return;
								api.dispatch(insertFolderNode(node));
							} else if (event.type === 'unlinkDir') {
								api.dispatch(removeNodeFromStoreByPath(event.path));
								api.dispatch(attemptReconciliation());
							}
						} else {
							if (event.type === 'change') {
								const lastWrite = api.getState().global.project.latestWrite;
								if (lastWrite && lastWrite.filePath === event.path) {
									const expiry = lastWrite.writtenAt + 1000;
									if (expiry > Date.now()) return;
								}
							}

							if (event.type === 'change' || event.type === 'add') {
								const node = await readRequestNode(event.path);
								api.dispatch(insertRequestNode(node));
							} else if (event.type === 'unlink') {
								const tree = api.getState().global.project.tree;
								const node = Object.values(tree).find(n => n.filePath === event.path);
								if (node) api.dispatch(closeTab(node.id));
								api.dispatch(removeNodeFromStoreByPath(event.path));
								api.dispatch(attemptReconciliation());
							}
						}
					} catch (error) {
						if (!(error instanceof Error)) return;
						await ipcDialogService.showMessageBox({
							type: 'error',
							title: 'Project data error',
							message: 'There was a problem reading a file or directory in your project',
							detail: [error.message, error.stack].join('\n'),
						});
					}
				},
				{ followSymlinks: false },
			);

			// Forever; cleanup happens when the window closes.
			void subscription;
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
	];
	for (const ac of nodeUpdateActions) {
		start({
			actionCreator: ac,
			effect: async ({ payload }, api) => {
				const requestId = (payload as { requestId: string }).requestId;
				let node = api.getState().global.project.tree[requestId];
				if (!node || node.type !== 'request') return;

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

	// Create new folder / request — async because we wait for the fs watcher to
	// emit the insert action so we can immediately start the rename UI on it.
	start({
		actionCreator: createNewFolder,
		effect: async ({ payload }, api) => {
			const parentNode = payload.highlightedNodeId
				? api.getState().global.project.tree[payload.highlightedNodeId]
				: undefined;

			let directory = 'tree/';
			if (parentNode) directory = parentNode.type === 'folder' ? parentNode.filePath : path.dirname(parentNode.filePath);

			const resolvedPath = await createFolderNode(directory, payload.name);

			await api.take(insertFolderNode.match, 250);
			api.dispatch(projectActions.renameStarted({ requestId: resolvedPath }));
		},
	});
	start({
		actionCreator: createNewRequest,
		effect: async ({ payload }, api) => {
			const parentNode = payload.highlightedNodeId
				? api.getState().global.project.tree[payload.highlightedNodeId]
				: undefined;

			let directory = 'tree/';
			if (parentNode) directory = parentNode.type === 'folder' ? parentNode.filePath : path.dirname(parentNode.filePath);

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

			const newNodeId = await duplicateRequestNode(node);

			if (!newNodeId) {
				await ipcDialogService.showMessageBox({
					type: 'error',
					title: 'Unable to duplicate broken request',
					message: "You can't duplicate a request which has validation errors. Once they are fixed please try again",
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

			if (withConfirmation) {
				const response = await ipcDialogService.showMessageBox({
					title: 'Deleting file or folder',
					message: `You are about to delete '${node.name}' from your machine. Are you sure you want to continue?`,
					detail: 'This action is irreversible inside Beak!',
					type: 'warning',
					buttons: ['Remove', 'Cancel'],
					defaultId: 0,
				});
				if (response.response === 1) return;
			}

			if (node.type === 'folder') await removeFolderNode(node.filePath);
			else if (node.type === 'request') await removeRequestNode(node.filePath);

			api.dispatch(removeNodeFromStore(requestId));
			api.dispatch(attemptReconciliation());
		},
	});

	// Rename node.
	start({
		actionCreator: renameSubmitted,
		effect: async ({ payload }, api) => {
			const activeRename = api.getState().global.project.activeRename as ActiveRename | undefined;
			const node = api.getState().global.project.tree[payload.requestId];

			if (!activeRename || activeRename.id !== payload.requestId) return;

			if (activeRename.name === node.name) {
				api.dispatch(projectActions.renameResolved({ requestId: payload.requestId }));
				return;
			}

			if (node.type === 'request') {
				try {
					await renameRequestNode(activeRename.name, node as RequestNode);
					api.dispatch(projectActions.renameResolved({ requestId: payload.requestId }));
					await api.delay(200);
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

async function initialImport(
	api: { dispatch: (a: { type: string; [k: string]: unknown }) => unknown },
	treePath: string,
) {
	const items = await scanDirectoryRecursively(treePath);

	const folders = items.filter(s => s.isDirectory);
	const requests = items.filter(s => !s.isDirectory);

	const folderNodes = await readFolderNodes(folders);
	const requestNodes = await readRequestNodes(requests);
	const tree: Tree = { ...folderNodes, ...requestNodes } as Tree;

	api.dispatch(projectOpened({ tree }));
}

async function readFolderNodes(folders: { path: string; isDirectory: boolean }[]) {
	if (folders.length === 0) return {};
	const results = await Promise.all(folders.map(f => readFolderNode(f.path)));
	return results.reduce((acc, val) => ({ ...acc, [val.id]: val }), {} as Record<string, unknown>);
}

async function readRequestNodes(requests: { path: string; isDirectory: boolean }[]) {
	if (requests.length === 0) return {};
	const results = await Promise.all(requests.map(f => readRequestNode(f.path)));
	return results.reduce((acc, val) => ({ ...acc, [val.id]: val }), {} as Record<string, unknown>);
}
