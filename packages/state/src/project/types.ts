import type { Tree } from '@getbeak/types/nodes';

/**
 * The pure project tree state — what gets loaded from disk and the metadata
 * around it. UI-layer state (active rename, alerts, write debouncing, etc.)
 * lives in the consuming package, not here.
 */
export interface ProjectTreeState {
	loaded: boolean;
	id?: string;
	name?: string;
	tree: Tree;
}

export const initialProjectTreeState: ProjectTreeState = {
	loaded: false,
	tree: {},
};

export interface ProjectInfoPayload {
	id: string;
	name: string;
}

export interface ProjectOpenedPayload {
	tree: Tree;
}
