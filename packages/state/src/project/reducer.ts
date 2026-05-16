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
		});
}
