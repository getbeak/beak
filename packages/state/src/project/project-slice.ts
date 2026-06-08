import type { FolderNode, Tree, ValidRequestNode } from '@getbeak/types/nodes';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ProjectCookieConfig } from '../schemas';
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
// Inline business logic helpers
// TODO ADR 0005 §4: extract rewriteFolderTreePaths to a pure helper alongside the slice

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
// TODO ADR 0005 §4: extract to a pure helper alongside the slice
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

// TODO ADR 0005 §4: extract to a pure helper alongside the slice
function basename(p: string): string {
	const slash = p.lastIndexOf('/');
	return slash >= 0 ? p.slice(slash + 1) : p;
}

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
			// TODO ADR 0005 §4: extract rename pipeline to a pure helper alongside the slice
			node.name = payload.name;
			const oldPath = node.filePath;
			const slash = oldPath.lastIndexOf('/');
			const dir = slash >= 0 ? oldPath.slice(0, slash) : '';
			const newPath = dir ? `${dir}/${payload.name}` : payload.name;
			state.tree = rewriteFolderTreePaths(state.tree as Tree, node as FolderNode, newPath);
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

			// TODO ADR 0005 §4: extract move pipeline to a pure helper alongside the slice
			node.parent = payload.destinationFolderPath;
			state.tree = rewriteFolderTreePaths(state.tree as Tree, node as FolderNode, newPath);
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
