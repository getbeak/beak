import type { FolderNode, Tree, ValidRequestNode } from '@getbeak/types/nodes';
import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';

import * as actions from './actions';
import type { ProjectTreeState } from './types';

/**
 * Re-home a folder under `newPath`, rewriting every descendant's
 * `filePath` and `parent`. Folder descendants are re-keyed (folders are
 * tree-keyed by filePath); requests stay keyed by ksuid.
 *
 * Used by both folder rename and folder move — same path-rewrite
 * mechanics, the caller decides what `newPath` is.
 *
 * Mutates `tree` in place and returns the new tree object.
 */
function rewriteFolderTreePaths(tree: Tree, folder: FolderNode, newPath: string): Tree {
	const oldPath = folder.filePath;
	if (newPath === oldPath) return tree;

	const oldPrefix = `${oldPath}/`;
	const newPrefix = `${newPath}/`;

	const next = {} as Tree;
	for (const [key, child] of Object.entries(tree)) {
		if (child === folder) continue; // re-inserted by caller
		if (child.filePath === oldPath) continue; // duplicate of `folder`

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

/**
 * Attaches the pure project-tree reducer cases to the given builder. The
 * builder's state type only needs to be a subtype of ProjectTreeState — UI
 * packages compose this into a wider state shape that adds their own fields
 * (rename, alerts, file-watch debouncing, etc.).
 */
export function buildProjectTreeReducer<S extends ProjectTreeState>(builder: ActionReducerMapBuilder<S>) {
	builder
		.addCase(actions.startProject, state => {
			state.loaded = false;
			state.loadError = undefined;
		})
		.addCase(actions.insertProjectInfo, (state, { payload }) => {
			state.name = payload.name;
			state.id = payload.id;
			state.folderPath = payload.folderPath;
			state.mode = payload.mode;
		})
		.addCase(actions.projectOpened, (state, { payload }) => {
			state.tree = payload.tree;
			state.loaded = true;
			state.loadError = undefined;
		})
		.addCase(actions.projectLoadFailed, (state, { payload }) => {
			state.loadError = payload.error;
			state.loaded = false;
		})
		.addCase(actions.markNoProject, state => {
			state.loaded = true;
			state.mode = 'none';
			state.tree = {} as typeof state.tree;
			state.id = undefined;
			state.name = undefined;
			state.folderPath = undefined;
			state.loadError = undefined;
		})
		.addCase(actions.materialiseInMemoryProject, (state, { payload }) => {
			state.mode = 'memory';
			state.id = payload.id;
			state.name = payload.name;
			state.folderPath = undefined;
		})

		.addCase(actions.insertRequestNode, (state, action) => {
			const node = action.payload as ValidRequestNode;
			state.tree[node.id] = node;
		})
		.addCase(actions.insertFolderNode, (state, action) => {
			const node = action.payload as FolderNode;
			state.tree[node.filePath] = node;
		})

		.addCase(actions.removeNodeFromStore, (state, { payload }) => {
			const { [payload]: _remove, ...rest } = state.tree;
			state.tree = rest;
		})
		.addCase(actions.removeNodeFromStoreByPath, (state, { payload }) => {
			const node = Object.values(state.tree).find(n => n.filePath === payload);
			if (!node) return;

			const { [node.id]: _remove, ...rest } = state.tree;
			state.tree = rest;
		})
		.addCase(actions.renameNodeInTree, (state, { payload }) => {
			// Folders are keyed by filePath but the lookup id we receive is the
			// caller's chosen identity (request id, or folder filePath). Try
			// both — id-keyed first (request path), then filePath-keyed (folder).
			const node = state.tree[payload.nodeId]
				?? Object.values(state.tree).find(n => n.filePath === payload.nodeId);
			if (!node) return;

			if (node.type === 'request') {
				// Memory-mode requests carry synthetic filePaths like
				// `tree/<name>.json` — nothing reads them, Save Project As
				// regenerates real paths from the tree shape. Just patch the
				// name; leave the stale path in place.
				node.name = payload.name;
				return;
			}

			// Folder rename: rebuild the new path under the same parent dir.
			node.name = payload.name;
			const oldPath = node.filePath;
			const slash = oldPath.lastIndexOf('/');
			const dir = slash >= 0 ? oldPath.slice(0, slash) : '';
			const newPath = dir ? `${dir}/${payload.name}` : payload.name;
			state.tree = rewriteFolderTreePaths(state.tree as Tree, node as FolderNode, newPath);
		})
		.addCase(actions.moveNodeInTree, (state, { payload }) => {
			const node = state.tree[payload.nodeId]
				?? Object.values(state.tree).find(n => n.filePath === payload.nodeId);
			if (!node) return;

			const newPath = `${payload.destinationFolderPath}/${basename(node.filePath)}`;
			if (newPath === node.filePath) return;

			if (node.type === 'request') {
				node.filePath = newPath;
				node.parent = payload.destinationFolderPath;
				return;
			}

			node.parent = payload.destinationFolderPath;
			state.tree = rewriteFolderTreePaths(state.tree as Tree, node as FolderNode, newPath);
		});
}
