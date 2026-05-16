import type { SerializedSquawk } from '@beak/squawk';
import type { Tree } from '@getbeak/types/nodes';

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

export interface ProjectInfoPayload {
	id: string;
	name: string;
	folderPath?: string;
	mode: 'memory' | 'disk';
}

export interface ProjectOpenedPayload {
	tree: Tree;
}

export interface ProjectLoadFailedPayload {
	error: SerializedSquawk;
}
