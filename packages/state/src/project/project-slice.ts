import type { FolderNode, ValidRequestNode } from '@getbeak/types/nodes';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ProjectCookieConfig } from '../schemas';
import { basename, moveFolderInTree, renameFolderInTree } from './helpers';
import type {
	MaterialiseInMemoryProjectPayload,
	MoveNodeInTreePayload,
	ProjectInfoPayload,
	ProjectLoadFailedPayload,
	ProjectOpenedPayload,
	ProjectTreeState,
	RenameNodeInTreePayload,
	RenameProjectPayload,
} from './types';
import { initialProjectTreeState } from './types';

// ---------------------------------------------------------------------------
// Slice

const projectSlice = createSlice({
	name: 'project',
	initialState: initialProjectTreeState,
	reducers: {
		startProject: state => {
			state.loaded = false;
			state.loadError = undefined;
		},

		insertProjectInfo: (state, { payload }: PayloadAction<ProjectInfoPayload>) => {
			state.name = payload.name;
			state.id = payload.id;
			state.folderPath = payload.folderPath;
			state.mode = payload.mode;
			state.cookies = payload.cookies;
		},

		projectOpened: (state, { payload }: PayloadAction<ProjectOpenedPayload>) => {
			state.tree = payload.tree;
			state.loaded = true;
			state.loadError = undefined;
		},

		projectLoadFailed: (state, { payload }: PayloadAction<ProjectLoadFailedPayload>) => {
			state.loadError = payload.error;
			state.loaded = false;
		},

		/**
		 * Mark this window as the empty workbench — no project on disk, no
		 * in-memory project either. Sets `mode: 'none'` and `loaded: true` so the
		 * renderer skips the loading splash and goes straight to the welcome tab.
		 */
		markNoProject: state => {
			state.loaded = true;
			state.mode = 'none';
			state.tree = {} as typeof state.tree;
			state.id = undefined;
			state.name = undefined;
			state.folderPath = undefined;
			state.loadError = undefined;
		},

		/**
		 * Promote an empty workbench (`mode: 'none'`) to an in-memory scratch
		 * project (`mode: 'memory'`). Fired as soon as the user takes a tree-
		 * mutating action (new request, new folder, …) from the welcome tab.
		 * Nothing is written to disk — the project lives entirely in redux until
		 * the user picks Save Project As, which transitions us to `mode: 'disk'`.
		 */
		materialiseInMemoryProject: (state, { payload }: PayloadAction<MaterialiseInMemoryProjectPayload>) => {
			state.mode = 'memory';
			state.id = payload.id;
			state.name = payload.name;
			state.folderPath = undefined;
		},

		/**
		 * Update the project's display name. The reducer applies the change
		 * immediately; the renderer-side effect persists it to `project.json`
		 * (only when `mode === 'disk'` — memory projects pick up the rename on
		 * Save Project As).
		 */
		renameProject: (state, { payload }: PayloadAction<RenameProjectPayload>) => {
			state.name = payload.name;
		},

		insertRequestNode: (state, action: PayloadAction<unknown>) => {
			const node = action.payload as ValidRequestNode;
			state.tree[node.id] = node;
		},

		insertFolderNode: (state, action: PayloadAction<unknown>) => {
			const node = action.payload as FolderNode;
			state.tree[node.filePath] = node;
		},

		removeNodeFromStore: (state, { payload }: PayloadAction<string>) => {
			const { [payload]: _remove, ...rest } = state.tree;
			state.tree = rest;
		},

		removeNodeFromStoreByPath: (state, { payload }: PayloadAction<string>) => {
			const node = Object.values(state.tree).find(n => n.filePath === payload);
			if (!node) return;

			const { [node.id]: _remove, ...rest } = state.tree;
			state.tree = rest;
		},

		/**
		 * In-memory rename: change a node's display name without touching disk.
		 * Used by memory-mode projects (no fs round-trip via the watcher to fold
		 * back into the tree). For folders this also re-keys the entry under its
		 * new path AND rewrites every descendant's `filePath` / `parent` prefix.
		 */
		renameNodeInTree: (state, { payload }: PayloadAction<RenameNodeInTreePayload>) => {
			// Folders are keyed by filePath but the lookup id we receive is the
			// caller's chosen identity (request id, or folder filePath). Try
			// both — id-keyed first (request path), then filePath-keyed (folder).
			const node = state.tree[payload.nodeId] ?? Object.values(state.tree).find(n => n.filePath === payload.nodeId);
			if (!node) return;

			if (node.type === 'request') {
				// Update the name and re-derive the filePath under the same
				// directory + extension. Disk-mode callers (the rename effect)
				// rely on this optimistic path update so the open tab stays
				// mounted while the fs-watcher's delete-then-create cycle is
				// in flight. Memory-mode filePaths are synthetic — rewriting
				// `tree/<old>.json` to `tree/<new>.json` keeps them
				// consistent without changing any read paths.
				node.name = payload.name;
				const slash = node.filePath.lastIndexOf('/');
				const dir = slash >= 0 ? node.filePath.slice(0, slash) : '';
				const base = slash >= 0 ? node.filePath.slice(slash + 1) : node.filePath;
				const dot = base.lastIndexOf('.');
				const ext = dot > 0 ? base.slice(dot) : '';
				node.filePath = dir ? `${dir}/${payload.name}${ext}` : `${payload.name}${ext}`;
				return;
			}

			// Folder rename: rebuild the new path under the same parent dir.
			state.tree = renameFolderInTree(state.tree, node as FolderNode, payload.name);
		},

		/**
		 * In-memory move: re-parent a node into a new folder. Folder sources get
		 * re-keyed AND have their descendants rewritten (mirrors renameNodeInTree's
		 * folder behaviour). Requests just update `filePath` + `parent`.
		 */
		moveNodeInTree: (state, { payload }: PayloadAction<MoveNodeInTreePayload>) => {
			const node = state.tree[payload.nodeId] ?? Object.values(state.tree).find(n => n.filePath === payload.nodeId);
			if (!node) return;

			const newPath = `${payload.destinationFolderPath}/${basename(node.filePath)}`;
			if (newPath === node.filePath) return;

			if (node.type === 'request') {
				node.filePath = newPath;
				node.parent = payload.destinationFolderPath;
				return;
			}

			state.tree = moveFolderInTree(state.tree, node as FolderNode, payload.destinationFolderPath);
		},
	},
});

// ---------------------------------------------------------------------------
// Named selectors (ADR 0005 §3)
//
// The slice owns only `ProjectTreeState`. The UI mounts the wider `State`
// (which extends ProjectTreeState) at `state.global.project`. These selectors
// accept any object whose `global.project` satisfies `ProjectTreeState` so
// they compose cleanly from both the state package's own tests and the UI.

type WithProject = { global: { project: ProjectTreeState } };

/** Whether the project has finished loading (or explicitly determined there is nothing to load). */
export const selectProjectLoaded = (state: WithProject) => state.global.project.loaded;

/** `'none' | 'memory' | 'disk'` — what kind of project is currently open. */
export const selectProjectMode = (state: WithProject) => state.global.project.mode;

/** Stable project identifier (ksuid). Undefined when `mode === 'none'` and not yet set. */
export const selectProjectId = (state: WithProject) => state.global.project.id ?? null;

/** Display name of the current project. Undefined when no project is open. */
export const selectProjectName = (state: WithProject) => state.global.project.name;

/** Absolute folder path on disk. Only set when `mode === 'disk'`. */
export const selectProjectFolderPath = (state: WithProject) => state.global.project.folderPath;

/** Project-wide cookie configuration (primary variable set, etc). */
export const selectProjectCookies = (state: WithProject): ProjectCookieConfig | undefined =>
	state.global.project.cookies;

/** The full request/folder tree, keyed by node id (requests) or filePath (folders). */
export const selectProjectTree = (state: WithProject) => state.global.project.tree;

/** Load error, if the initial project load failed. Cleared on successful load. */
export const selectProjectLoadError = (state: WithProject) => state.global.project.loadError;

/** True when `mode === 'memory'` — the project is unsaved and lives only in Redux. */
export const selectIsMemoryProject = (state: WithProject) => state.global.project.mode === 'memory';

/** True when `mode === 'disk'` — the project has a persistent location on disk. */
export const selectIsDiskProject = (state: WithProject) => state.global.project.mode === 'disk';

// ---------------------------------------------------------------------------
// Exports

export const {
	startProject,
	insertProjectInfo,
	projectOpened,
	projectLoadFailed,
	markNoProject,
	materialiseInMemoryProject,
	renameProject,
	insertRequestNode,
	insertFolderNode,
	removeNodeFromStore,
	removeNodeFromStoreByPath,
	renameNodeInTree,
	moveNodeInTree,
} = projectSlice.actions;

export default projectSlice.reducer;
