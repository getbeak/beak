import ksuid from '@beak/ksuid';
import {
	insertFolderNode,
	insertRequestNode,
	moveNodeInTree,
	type ProjectMode,
	removeNodeFromStore,
} from '@beak/state/project';
import { attemptReconciliation, changeTab, makeTabPermanent } from '@beak/ui/features/tabs/store/actions';
import { ipcDialogService } from '@beak/ui/lib/ipc';
import * as projectActions from '@beak/ui/store/project/actions';
import * as workflowActions from '@beak/ui/store/workflows/actions';
import type { FolderNode, RequestNode, Tree } from '@getbeak/types/nodes';
import path from 'path-browserify';
import { createFolderNode, removeFolderNode } from './folder';
import { moveNodesOnDisk } from './nodes';
import { createRequestNode, duplicateRequestNode, removeRequestNode } from './request';

export interface MutationsApi {
	getState: () => {
		global: {
			project: {
				mode: ProjectMode;
				tree: Tree;
			};
			workflows: { workflows: Record<string, unknown> };
		};
		features: {
			tabs: {
				activeTabs: Array<{ type: string; payload: string; temporary: boolean }>;
			};
		};
	};
	dispatch: (a: unknown) => unknown;
	take: (predicate: (action: unknown) => boolean, timeout: number) => Promise<unknown>;
	delay: (ms: number) => Promise<void>;
}

/**
 * Walk a tree rooted at `nodeId` and collect every request id under it
 * (the node itself if it's a request, descendants if it's a folder).
 */
export function collectRequestIdsUnder(tree: Tree, nodeId: string): string[] {
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

export interface CreateNewFolderArgs {
	highlightedNodeId?: string;
	name?: string;
}

export async function runCreateNewFolder(args: CreateNewFolderArgs, api: MutationsApi, mode: ProjectMode) {
	const parentNode = args.highlightedNodeId ? api.getState().global.project.tree[args.highlightedNodeId] : undefined;

	let directory = 'tree/';
	if (parentNode) directory = parentNode.type === 'folder' ? parentNode.filePath : path.dirname(parentNode.filePath);

	if (mode !== 'disk') {
		const name = args.name ?? 'New folder';
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

	const resolvedPath = await createFolderNode(directory, args.name);
	await api.take(insertFolderNode.match, 250);
	api.dispatch(projectActions.renameStarted({ requestId: resolvedPath }));
}

export interface CreateNewRequestArgs {
	highlightedNodeId?: string;
	name?: string;
}

export async function runCreateNewRequest(args: CreateNewRequestArgs, api: MutationsApi, mode: ProjectMode) {
	const parentNode = args.highlightedNodeId ? api.getState().global.project.tree[args.highlightedNodeId] : undefined;

	let directory = 'tree/';
	if (parentNode) directory = parentNode.type === 'folder' ? parentNode.filePath : path.dirname(parentNode.filePath);

	if (mode !== 'disk') {
		const id = ksuid.generate('request').toString();
		const name = args.name ?? 'New request';
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

	const nodeId = await createRequestNode(directory, args.name);
	await api.take(insertRequestNode.match, 250);
	api.dispatch(changeTab({ type: 'request', payload: nodeId, temporary: true }));
	api.dispatch(projectActions.renameStarted({ requestId: nodeId }));
}

export interface DuplicateRequestArgs {
	requestId: string;
}

export async function runDuplicateRequest(args: DuplicateRequestArgs, api: MutationsApi) {
	const node = api.getState().global.project.tree[args.requestId];
	if (!node || node.type !== 'request') return;

	if (api.getState().global.project.mode !== 'disk') {
		if (node.mode !== 'valid') return;
		const validNode = node;
		const id = ksuid.generate('request').toString();
		const name = `${validNode.name} copy`;
		const filePath = path.join(path.dirname(validNode.filePath), `${name}.json`);
		const cloned: RequestNode = {
			...validNode,
			id,
			name,
			filePath,
			info: structuredClone(validNode.info),
		};
		api.dispatch(insertRequestNode(cloned));
		api.dispatch(changeTab({ type: 'request', payload: id, temporary: true }));
		return;
	}

	const newNodeId = await duplicateRequestNode(node as RequestNode);

	if (!newNodeId) {
		await ipcDialogService.showMessageBox({
			type: 'error',
			title: 'Unable to duplicate broken request',
			message: "You can't duplicate a request which has validation errors. Once they are fixed please try again.",
			detail: 'Message @beakapp on twitter for support.',
		});
		return;
	}

	await api.take(insertRequestNode.match, 250);
	api.dispatch(changeTab({ type: 'request', payload: newNodeId, temporary: true }));
}

export interface MoveNodeArgs {
	sourceNodeId: string;
	destinationNodeId: string;
}

export async function runMoveNode(args: MoveNodeArgs, api: MutationsApi) {
	const tree = api.getState().global.project.tree;
	const sourceNode = tree[args.sourceNodeId];
	const destinationNode = tree[args.destinationNodeId];
	const tabs = api.getState().features.tabs.activeTabs;
	const openedTab = tabs.find(t => t.type === 'request' && t.payload === sourceNode?.id);

	if (!sourceNode) return;
	if (!destinationNode && args.destinationNodeId !== 'root') return;

	if (api.getState().global.project.mode !== 'disk') {
		const destinationFolderPath = !destinationNode
			? 'tree'
			: destinationNode.type === 'folder'
				? destinationNode.filePath
				: (destinationNode.parent ?? 'tree');
		api.dispatch(moveNodeInTree({ nodeId: args.sourceNodeId, destinationFolderPath }));
		if (openedTab) api.dispatch(makeTabPermanent(openedTab.payload));
		return;
	}

	await moveNodesOnDisk(sourceNode, destinationNode);

	if (!openedTab) return;

	await api.delay(300);
	api.dispatch(changeTab({ type: 'request', payload: openedTab.payload, temporary: false }));
	api.dispatch(makeTabPermanent(openedTab.payload));
}

export interface RemoveNodeArgs {
	requestId: string;
	withConfirmation: boolean;
}

export async function runRemoveNode(args: RemoveNodeArgs, api: MutationsApi) {
	const { requestId, withConfirmation } = args;
	const node = api.getState().global.project.tree[requestId];
	if (!node) return;

	const mode = api.getState().global.project.mode;

	if (mode === 'disk' && withConfirmation) {
		const response = await ipcDialogService.showMessageBox({
			title: 'Delete file or folder',
			message: `You are about to delete "${node.name}" from your machine. Are you sure you want to continue?`,
			detail: 'This action is irreversible inside Beak!',
			type: 'warning',
			buttons: ['Remove', 'Cancel'],
			defaultId: 1,
			cancelId: 1,
		});
		if (response.response === 1) return;
	}

	const droppedRequestIds = collectRequestIdsUnder(api.getState().global.project.tree, requestId);

	if (mode === 'disk') {
		if (node.type === 'folder') await removeFolderNode(node.filePath);
		else if (node.type === 'request') await removeRequestNode(node.filePath);
	}

	api.dispatch(removeNodeFromStore(requestId));
	api.dispatch(attemptReconciliation());
	if (droppedRequestIds.length > 0) {
		api.dispatch(workflowActions.purgeRequestRefs({ requestIds: droppedRequestIds }));
	}
}
