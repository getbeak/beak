import type {
	AvailableUpdate,
	Extension,
	ExtensionOperation,
	ExtensionSearchResult,
	FailedExtension,
	LoadedExtension,
} from '@beak/common/types/extensions';
import { createAction, createSlice, type PayloadAction } from '@reduxjs/toolkit';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type { Extension, FailedExtension, LoadedExtension };

export interface ExtensionsSearchState {
	query: string;
	results: ExtensionSearchResult[];
	loading: boolean;
}

/**
 * Shape of the `global.extensions` slice.
 * Exported so the store can type its `ApplicationState`; callers should
 * reach values through selectors rather than indexing fields directly.
 */
export interface ExtensionsSliceState {
	/** Extensions discovered in this project, keyed by package name. */
	extensions: Record<string, Extension>;
	/** In-flight management operations, keyed by package name. */
	operations: Record<string, ExtensionOperation>;
	/** Available newer versions, keyed by package name. */
	updates: Record<string, AvailableUpdate>;
	/** Live state for the install picker. */
	search: ExtensionsSearchState;
}

export const initialExtensionsSliceState: ExtensionsSliceState = {
	extensions: {},
	operations: {},
	updates: {},
	search: { query: '', results: [], loading: false },
};

/** Root-state shape accepted by all extensions selectors. */
export interface ExtensionsRootState {
	global: { extensions: ExtensionsSliceState };
}

/* -------------------------------------------------------------------------- */
/*  Effect triggers (signal-only, no state mutation)                         */
/* -------------------------------------------------------------------------- */

export const startExtensions = createAction('extensions/startExtensions');
export const reloadExtensions = createAction('extensions/reloadExtensions');

export const installExtension = createAction<{ packageName: string; versionRange?: string }>('extensions/install');
export const removeExtension = createAction<{ packageName: string }>('extensions/remove');
export const updateExtension = createAction<{ packageName: string; versionRange?: string }>('extensions/update');
export const checkExtensionUpdates = createAction('extensions/checkUpdates');
export const searchExtensions = createAction<{ query: string }>('extensions/search');

/* -------------------------------------------------------------------------- */
/*  Slice                                                                     */
/* -------------------------------------------------------------------------- */

const extensionsSlice = createSlice({
	name: 'extensions',
	initialState: initialExtensionsSliceState,
	reducers: {
		extensionsLoaded: (state, { payload }: PayloadAction<{ extensions: Extension[] }>) => {
			const next: Record<string, Extension> = {};
			for (const ext of payload.extensions) next[ext.packageName] = ext;
			state.extensions = next;
		},

		extensionUpsert: (state, { payload }: PayloadAction<{ extension: Extension }>) => {
			state.extensions[payload.extension.packageName] = payload.extension;
		},

		extensionRemoved: (state, { payload }: PayloadAction<{ packageName: string }>) => {
			delete state.extensions[payload.packageName];
			delete state.updates[payload.packageName];
		},

		operationChanged: (
			state,
			{ payload }: PayloadAction<{ packageName: string; operation: ExtensionOperation | null }>,
		) => {
			if (payload.operation) state.operations[payload.packageName] = payload.operation;
			else delete state.operations[payload.packageName];
		},

		updatesAvailable: (state, { payload }: PayloadAction<{ updates: AvailableUpdate[] }>) => {
			state.updates = {};
			for (const update of payload.updates) state.updates[update.packageName] = update;
		},

		searchStateChanged: (
			state,
			{ payload }: PayloadAction<{ query?: string; results?: ExtensionSearchResult[]; loading?: boolean }>,
		) => {
			if (payload.query !== undefined) state.search.query = payload.query;
			if (payload.results !== undefined) state.search.results = payload.results;
			if (payload.loading !== undefined) state.search.loading = payload.loading;
		},
	},
});

export const { extensionsLoaded, extensionUpsert, extensionRemoved, operationChanged, updatesAvailable, searchStateChanged } =
	extensionsSlice.actions;

export default extensionsSlice.reducer;

/* -------------------------------------------------------------------------- */
/*  Selectors                                                                 */
/* -------------------------------------------------------------------------- */

/** All extensions as an array. */
export function selectExtensions(state: ExtensionsRootState): Extension[] {
	return Object.values(state.global.extensions.extensions);
}

/** Raw extensions record, keyed by package name. */
export function selectExtensionsMap(state: ExtensionsRootState): Record<string, Extension> {
	return state.global.extensions.extensions;
}

/** Only the successfully-loaded extensions. */
export function selectLoadedExtensions(state: ExtensionsRootState): LoadedExtension[] {
	return selectExtensions(state).filter((e): e is LoadedExtension => e.status === 'loaded');
}

/** Only the extensions that failed to load. */
export function selectFailedExtensions(state: ExtensionsRootState): FailedExtension[] {
	return selectExtensions(state).filter((e): e is FailedExtension => e.status === 'failed');
}

/** In-flight management operation for a single package, or `null`. */
export function selectExtensionOperation(state: ExtensionsRootState, packageName: string): ExtensionOperation | null {
	return state.global.extensions.operations[packageName] ?? null;
}

/** All in-flight operations, keyed by package name. */
export function selectExtensionsOperations(state: ExtensionsRootState): Record<string, ExtensionOperation> {
	return state.global.extensions.operations;
}

/** Available update for a single package, or `null`. */
export function selectExtensionUpdate(state: ExtensionsRootState, packageName: string): AvailableUpdate | null {
	return state.global.extensions.updates[packageName] ?? null;
}

/** All available updates, keyed by package name. */
export function selectExtensionsUpdates(state: ExtensionsRootState): Record<string, AvailableUpdate> {
	return state.global.extensions.updates;
}

/** Live search state for the extension install picker. */
export function selectExtensionSearch(state: ExtensionsRootState): ExtensionsSearchState {
	return state.global.extensions.search;
}
