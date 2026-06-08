import { type ProjectMode, renameNodeInTree } from '@beak/state/project';
import { changeTab } from '@beak/ui/features/tabs/store/actions';
import type { ActiveRename } from '@beak/ui/features/tree-view/types';
import { ipcDialogService } from '@beak/ui/lib/ipc';
import * as projectActions from '@beak/ui/store/project/actions';
import { updateWorkflowName } from '@beak/ui/store/workflows/actions';
import type { FolderNode, RequestNode, Tree } from '@getbeak/types/nodes';
import path from 'path-browserify';
import { renameFolderNode } from './folder';
import { registerFolderRename, registerRequestRename } from './pending-renames';
import { renameRequestNode } from './request';

export interface RenameApi {
	getState: () => {
		global: {
			project: {
				mode: ProjectMode;
				tree: Tree;
				activeRename?: ActiveRename;
			};
			workflows: {
				workflows: Record<string, { name: string }>;
			};
		};
	};
	dispatch: (a: unknown) => unknown;
}

export interface RenameSubmittedArgs {
	requestId: string;
}

/**
 * Execute a rename submit: routes to workflow rename, in-memory rename,
 * or disk rename (request or folder), with optimistic tree patch and
 * fs-watcher suppression. Unchanged renames resolve immediately.
 */
export async function runRenameSubmitted(args: RenameSubmittedArgs, api: RenameApi): Promise<void> {
	const activeRename = api.getState().global.project.activeRename as ActiveRename | undefined;
	const node = api.getState().global.project.tree[args.requestId];

	if (!activeRename || activeRename.id !== args.requestId) return;

	// Workflows share the rename slot but live outside the project tree.
	if (!node) {
		const workflow = api.getState().global.workflows.workflows[args.requestId];
		if (!workflow) return;

		if (activeRename.name !== workflow.name) {
			api.dispatch(updateWorkflowName({ id: args.requestId, name: activeRename.name }));
		}
		api.dispatch(projectActions.renameResolved({ requestId: args.requestId }));
		return;
	}

	// No-op rename.
	if (activeRename.name === node.name) {
		api.dispatch(projectActions.renameResolved({ requestId: args.requestId }));
		return;
	}

	// Memory-mode: patch redux only; paths stay synthetic until Save Project As.
	if (api.getState().global.project.mode !== 'disk') {
		api.dispatch(renameNodeInTree({ nodeId: args.requestId, name: activeRename.name }));
		api.dispatch(projectActions.renameResolved({ requestId: args.requestId }));
		return;
	}

	if (node.type === 'request') {
		await runRenameRequest(args.requestId, activeRename.name, node as RequestNode, api);
	} else if (node.type === 'folder') {
		await runRenameFolder(args.requestId, activeRename.name, node as FolderNode, api);
	}
}

async function runRenameRequest(requestId: string, newName: string, node: RequestNode, api: RenameApi) {
	try {
		const oldPath = node.filePath;
		const newPath = path.join(path.dirname(oldPath), `${newName}${path.extname(oldPath)}`);

		// Suppress the unlink(old)+add(new) pair the fs-watcher is about to emit,
		// then optimistically rewrite the tree. The tab stays mounted because
		// its backing node never leaves the store.
		registerRequestRename(oldPath, newPath);
		api.dispatch(renameNodeInTree({ nodeId: requestId, name: newName }));

		await renameRequestNode(newName, node);
		api.dispatch(projectActions.renameResolved({ requestId }));
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
}

async function runRenameFolder(requestId: string, newName: string, node: FolderNode, api: RenameApi) {
	try {
		const oldPath = node.filePath;
		const newPath = path.join(path.dirname(oldPath), newName);

		// Folder rename fans out to every descendant — register the entire
		// burst before the move so the tree-event handler can drop them all.
		registerFolderRename(api.getState().global.project.tree as Tree, oldPath, newPath);
		api.dispatch(renameNodeInTree({ nodeId: requestId, name: newName }));

		await renameFolderNode(newName, node);
		api.dispatch(projectActions.renameResolved({ requestId }));
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
