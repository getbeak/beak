import type {
	AvailableUpdate,
	Extension,
	ExtensionOperation,
	ExtensionSearchResult,
	FailedExtension,
	LoadedExtension,
} from '@beak/common/types/extensions';
import { createAction, createReducer } from '@reduxjs/toolkit';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type { Extension, FailedExtension, LoadedExtension };

export interface ExtensionsSearchState {
	query: string;
	results: ExtensionSearchResult[];
	loading: boolean;
}

export interface ExtensionsState {
	/** Extensions discovered in this project, keyed by package name. */
	extensions: Record<string, Extension>;
	/** In-flight management operations, keyed by package name. */
	operations: Record<string, ExtensionOperation>;
	/** Available newer versions, keyed by package name. */
	updates: Record<string, AvailableUpdate>;
	/** Live state for the install picker. */
	search: ExtensionsSearchState;
}

export const initialExtensionsState: ExtensionsState = {
	extensions: {},
	operations: {},
	updates: {},
	search: { query: '', results: [], loading: false },
};

/* -------------------------------------------------------------------------- */
/*  Effect triggers (no payload mutation, just signal to listener middleware) */
/* -------------------------------------------------------------------------- */

export const startExtensions = createAction('extensions/startExtensions');
export const reloadExtensions = createAction('extensions/reloadExtensions');

export const installExtension = createAction<{ packageName: string; versionRange?: string }>('extensions/install');
export const removeExtension = createAction<{ packageName: string }>('extensions/remove');
export const updateExtension = createAction<{ packageName: string; versionRange?: string }>('extensions/update');
export const checkExtensionUpdates = createAction('extensions/checkUpdates');
export const searchExtensions = createAction<{ query: string }>('extensions/search');

/* -------------------------------------------------------------------------- */
/*  Reducer-driven state changes                                              */
/* -------------------------------------------------------------------------- */

export const extensionsLoaded = createAction<{ extensions: Extension[] }>('extensions/loaded');
export const extensionUpsert = createAction<{ extension: Extension }>('extensions/upsert');
export const extensionRemoved = createAction<{ packageName: string }>('extensions/removed');
export const operationChanged = createAction<{
	packageName: string;
	operation: ExtensionOperation | null;
}>('extensions/operationChanged');
export const updatesAvailable = createAction<{ updates: AvailableUpdate[] }>('extensions/updatesAvailable');
export const searchStateChanged = createAction<{
	query?: string;
	results?: ExtensionSearchResult[];
	loading?: boolean;
}>('extensions/searchChanged');

/* -------------------------------------------------------------------------- */
/*  Reducer                                                                   */
/* -------------------------------------------------------------------------- */

const extensionsReducer = createReducer(initialExtensionsState, builder => {
	builder.addCase(extensionsLoaded, (state, { payload }) => {
		const next: Record<string, Extension> = {};
		for (const ext of payload.extensions) next[ext.packageName] = ext;
		state.extensions = next;
	});

	builder.addCase(extensionUpsert, (state, { payload }) => {
		state.extensions[payload.extension.packageName] = payload.extension;
	});

	builder.addCase(extensionRemoved, (state, { payload }) => {
		delete state.extensions[payload.packageName];
		delete state.updates[payload.packageName];
	});

	builder.addCase(operationChanged, (state, { payload }) => {
		if (payload.operation) state.operations[payload.packageName] = payload.operation;
		else delete state.operations[payload.packageName];
	});

	builder.addCase(updatesAvailable, (state, { payload }) => {
		state.updates = {};
		for (const update of payload.updates) state.updates[update.packageName] = update;
	});

	builder.addCase(searchStateChanged, (state, { payload }) => {
		if (payload.query !== undefined) state.search.query = payload.query;
		if (payload.results !== undefined) state.search.results = payload.results;
		if (payload.loading !== undefined) state.search.loading = payload.loading;
	});
});

export default extensionsReducer;

/* -------------------------------------------------------------------------- */
/*  Selectors                                                                 */
/* -------------------------------------------------------------------------- */

export interface ExtensionsRootState {
	global: { extensions: ExtensionsState };
}

export function selectExtensions(state: ExtensionsRootState): Extension[] {
	return Object.values(state.global.extensions.extensions);
}

export function selectLoadedExtensions(state: ExtensionsRootState): LoadedExtension[] {
	return selectExtensions(state).filter((e): e is LoadedExtension => e.status === 'loaded');
}

export function selectFailedExtensions(state: ExtensionsRootState): FailedExtension[] {
	return selectExtensions(state).filter((e): e is FailedExtension => e.status === 'failed');
}

export function selectExtensionOperation(state: ExtensionsRootState, packageName: string) {
	return state.global.extensions.operations[packageName] ?? null;
}

export function selectExtensionUpdate(state: ExtensionsRootState, packageName: string) {
	return state.global.extensions.updates[packageName] ?? null;
}

export function selectExtensionSearch(state: ExtensionsRootState) {
	return state.global.extensions.search;
}
