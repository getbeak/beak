import type { SerializedSquawk } from '@beak/squawk';
import type { Tree } from '@getbeak/types/nodes';

import type { ProjectCookieConfig } from '../schemas';

/**
 * Where the project lives, if anywhere. `none` is an empty workbench window
 * (welcome tab, no project). `memory` is an unsaved scratch project the user
 * started by editing in an empty window — held entirely in redux until they
 * Save Project As. `disk` is the only mode that participates in fs writes,
 * the tree watcher, git, and extensions.
 */
export type ProjectMode = 'none' | 'memory' | 'disk';

/**
 * The pure project tree state — what gets loaded from disk and the metadata
 * around it. UI-layer state (active rename, alerts, write debouncing, etc.)
 * lives in the consuming package, not here.
 */
export interface ProjectTreeState {
	loaded: boolean;
	mode: ProjectMode;
	id?: string;
	name?: string;
	/** Folder path on disk. Only set when `mode === 'disk'`. */
	folderPath?: string;
	/**
	 * Project-wide cookie config (primary variable set, …). Mirrored from
	 * `project.json`'s `cookies` field on load and back-written on edit.
	 * Absent means the project hasn't customised cookie behaviour and the
	 * runtime falls back to its defaults.
	 */
	cookies?: ProjectCookieConfig;
	tree: Tree;
	/**
	 * Set when the initial project load (or a retry) failed. While set, the
	 * renderer shows an inline error screen instead of the loading splash so
	 * the user can see what went wrong and try to fix it (e.g. a malformed
	 * project.json) without the window closing on them.
	 */
	loadError?: SerializedSquawk;
}

export const initialProjectTreeState: ProjectTreeState = {
	loaded: false,
	mode: 'none',
	tree: {},
};

// ---------------------------------------------------------------------------
// Action payload types

export interface ProjectInfoPayload {
	id: string;
	name: string;
	folderPath?: string;
	mode: 'memory' | 'disk';
	cookies?: ProjectCookieConfig;
}

export interface ProjectOpenedPayload {
	tree: Tree;
}

export interface ProjectLoadFailedPayload {
	error: SerializedSquawk;
}

export interface MaterialiseInMemoryProjectPayload {
	id: string;
	name: string;
}

export interface RenameProjectPayload {
	name: string;
}

export interface RenameNodeInTreePayload {
	nodeId: string;
	name: string;
}

export interface MoveNodeInTreePayload {
	/** ksuid for requests; folder.filePath for folders. */
	nodeId: string;
	/**
	 * Destination folder path — what the moved node's new parent will be.
	 * `null` means the project root (we use `'tree'` to match the on-disk
	 * convention).
	 */
	destinationFolderPath: string;
}
