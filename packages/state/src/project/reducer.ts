import type { FolderNode, ValidRequestNode } from '@getbeak/types/nodes';
import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';

import * as actions from './actions';
import type { ProjectTreeState } from './types';

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

			// Folder rename: re-key the folder itself and walk descendants
			// rewriting their `filePath` (and `parent`) prefix. Folders are
			// tree-keyed by filePath, so descendant folders also need re-keying;
			// requests stay keyed by ksuid.
			const oldPath = node.filePath;
			const slash = oldPath.lastIndexOf('/');
			const dir = slash >= 0 ? oldPath.slice(0, slash) : '';
			const newPath = dir ? `${dir}/${payload.name}` : payload.name;
			if (newPath === oldPath) return;

			const oldPrefix = `${oldPath}/`;
			const newPrefix = `${newPath}/`;

			const next = {} as typeof state.tree;
			for (const [key, child] of Object.entries(state.tree)) {
				if (child === node) continue; // re-inserted below

				if (child.filePath === oldPath) continue; // duplicate of `node`

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

			node.name = payload.name;
			node.filePath = newPath;
			(node as FolderNode).id = newPath;
			next[newPath] = node;
			state.tree = next;
		});
}
