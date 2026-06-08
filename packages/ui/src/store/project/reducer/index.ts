import {
	insertFolderNode,
	insertProjectInfo,
	insertRequestNode,
	markNoProject,
	materialiseInMemoryProject,
	moveNodeInTree,
	projectLoadFailed,
	projectOpened,
	removeNodeFromStore,
	removeNodeFromStoreByPath,
	renameNodeInTree,
	renameProject,
	startProject,
} from '@beak/state/project';
import type { FolderNode, Tree, ValidRequestNode } from '@getbeak/types/nodes';
import { createReducer } from '@reduxjs/toolkit';

import { initialState } from '../types';
import buildAlerts from './alerts';
import buildBody from './body';
import buildLifecycle from './lifecycle';
import buildRequestFields from './request-fields';
import buildTree from './tree';

// ---------------------------------------------------------------------------
// Local helpers (same logic as @beak/state/project until ADR 0005 §4 extraction)
// TODO ADR 0005 §4: de-duplicate once rewriteFolderTreePaths is extracted as a
// shared pure helper in @beak/state/project and importable from both packages.

function rewriteFolderTreePaths(tree: Tree, folder: FolderNode, newPath: string): Tree {
	const oldPath = folder.filePath;
	if (newPath === oldPath) return tree;

	const oldPrefix = `${oldPath}/`;
	const newPrefix = `${newPath}/`;

	const next = {} as Tree;
	for (const [key, child] of Object.entries(tree)) {
		if (child === folder) continue;
		if (child.filePath === oldPath) continue;

		if (child.filePath.startsWith(oldPrefix)) {
			child.filePath = newPrefix + child.filePath.slice(oldPrefix.length);
			if (child.parent === oldPath) {
				child.parent = newPath;
			} else if (child.parent && child.parent.startsWith(oldPrefix)) {
				child.parent = newPrefix + child.parent.slice(oldPrefix.length);
			}
			next[child.type === 'folder' ? child.filePath : key] = child;
			continue;
		}

		next[key] = child;
	}

	folder.filePath = newPath;
	folder.id = newPath;
	next[newPath] = folder;
	return next;
}

function basename(p: string): string {
	const slash = p.lastIndexOf('/');
	return slash >= 0 ? p.slice(slash + 1) : p;
}

// ---------------------------------------------------------------------------

const projectReducer = createReducer(initialState, builder => {
	// Pure project tree state — sourced from @beak/state/project (ADR 0005 §1).
	// These cases operate on the UI's wider State which extends ProjectTreeState;
	// the tree-mutation helpers (rewriteFolderTreePaths, basename) are inlined
	// here until ADR 0005 §4 extracts them as shared pure helpers.
	builder
		.addCase(startProject, state => {
			state.loaded = false;
			state.loadError = undefined;
		})
		.addCase(insertProjectInfo, (state, { payload }) => {
			state.name = payload.name;
			state.id = payload.id;
			state.folderPath = payload.folderPath;
			state.mode = payload.mode;
			state.cookies = payload.cookies;
		})
		.addCase(projectOpened, (state, { payload }) => {
			state.tree = payload.tree;
			state.loaded = true;
			state.loadError = undefined;
		})
		.addCase(projectLoadFailed, (state, { payload }) => {
			state.loadError = payload.error;
			state.loaded = false;
		})
		.addCase(markNoProject, state => {
			state.loaded = true;
			state.mode = 'none';
			state.tree = {} as typeof state.tree;
			state.id = undefined;
			state.name = undefined;
			state.folderPath = undefined;
			state.loadError = undefined;
		})
		.addCase(materialiseInMemoryProject, (state, { payload }) => {
			state.mode = 'memory';
			state.id = payload.id;
			state.name = payload.name;
			state.folderPath = undefined;
		})
		.addCase(renameProject, (state, { payload }) => {
			state.name = payload.name;
		})
		.addCase(insertRequestNode, (state, action) => {
			const node = action.payload as ValidRequestNode;
			state.tree[node.id] = node;
		})
		.addCase(insertFolderNode, (state, action) => {
			const node = action.payload as FolderNode;
			state.tree[node.filePath] = node;
		})
		.addCase(removeNodeFromStore, (state, { payload }) => {
			const { [payload]: _remove, ...rest } = state.tree;
			state.tree = rest;
		})
		.addCase(removeNodeFromStoreByPath, (state, { payload }) => {
			const node = Object.values(state.tree).find(n => n.filePath === payload);
			if (!node) return;
			const { [node.id]: _remove, ...rest } = state.tree;
			state.tree = rest;
		})
		.addCase(renameNodeInTree, (state, { payload }) => {
			const node = state.tree[payload.nodeId] ?? Object.values(state.tree).find(n => n.filePath === payload.nodeId);
			if (!node) return;
			if (node.type === 'request') {
				node.name = payload.name;
				const slash = node.filePath.lastIndexOf('/');
				const dir = slash >= 0 ? node.filePath.slice(0, slash) : '';
				const base = slash >= 0 ? node.filePath.slice(slash + 1) : node.filePath;
				const dot = base.lastIndexOf('.');
				const ext = dot > 0 ? base.slice(dot) : '';
				node.filePath = dir ? `${dir}/${payload.name}${ext}` : `${payload.name}${ext}`;
				return;
			}
			// TODO ADR 0005 §4: extract folder rename pipeline to a pure helper
			node.name = payload.name;
			const oldPath = node.filePath;
			const slash = oldPath.lastIndexOf('/');
			const dir = slash >= 0 ? oldPath.slice(0, slash) : '';
			const newPath = dir ? `${dir}/${payload.name}` : payload.name;
			state.tree = rewriteFolderTreePaths(state.tree as Tree, node as FolderNode, newPath);
		})
		.addCase(moveNodeInTree, (state, { payload }) => {
			const node = state.tree[payload.nodeId] ?? Object.values(state.tree).find(n => n.filePath === payload.nodeId);
			if (!node) return;
			const newPath = `${payload.destinationFolderPath}/${basename(node.filePath)}`;
			if (newPath === node.filePath) return;
			if (node.type === 'request') {
				node.filePath = newPath;
				node.parent = payload.destinationFolderPath;
				return;
			}
			// TODO ADR 0005 §4: extract folder move pipeline to a pure helper
			node.parent = payload.destinationFolderPath;
			state.tree = rewriteFolderTreePaths(state.tree as Tree, node as FolderNode, newPath);
		});

	// UI-coupled state.
	buildLifecycle(builder);
	buildRequestFields(builder);
	buildTree(builder);
	buildBody(builder);
	buildAlerts(builder);
});

export default projectReducer;
