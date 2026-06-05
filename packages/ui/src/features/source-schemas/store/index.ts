import { createAction, createReducer } from '@reduxjs/toolkit';

import type { SourceSchemaKind } from '../types';

/**
 * Renderer-only UI state for the schema-sources sidebar. Right now this
 * carries a single "pending dialog intent" — fired by the welcome screen
 * when the user clicks one of the "Connect …" tiles, consumed by
 * `SourceSchemasPane` once it mounts so the matching `SourceSchemaDialog` opens
 * automatically.
 */
export interface State {
	pendingSourceKind: SourceSchemaKind | null;
}

export const initialState: State = {
	pendingSourceKind: null,
};

export const requestSchemaSourceDialog = createAction<SourceSchemaKind>('endpoints-ui/requestSchemaSourceDialog');
export const clearPendingSchemaSource = createAction('endpoints-ui/clearPendingSchemaSource');

export const reducer = createReducer(initialState, builder => {
	builder
		.addCase(requestSchemaSourceDialog, (state, { payload }) => {
			state.pendingSourceKind = payload;
		})
		.addCase(clearPendingSchemaSource, state => {
			state.pendingSourceKind = null;
		});
});

export const actions = {
	requestSchemaSourceDialog,
	clearPendingSchemaSource,
};

export default { reducer, initialState, actions };
