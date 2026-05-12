import type { RealtimeValueExtension } from '@beak/common/types/extensions';
import type Squawk from '@beak/common/utils/squawk';
import { createAction, createReducer } from '@reduxjs/toolkit';

export interface FailedExtension {
	filePath: string;
	valid: false;
	error: Squawk;
}

export type Extension = FailedExtension | RealtimeValueExtension;

export interface ExtensionsState {
	extensions: Extension[];
}

export const initialExtensionsState: ExtensionsState = {
	extensions: [],
};

export interface ExtensionsOpenedPayload {
	extensions: Extension[];
}

export const startExtensions = createAction('extensions/startExtensions');
export const reloadExtensions = createAction('extensions/reloadExtensions');
export const extensionsOpened = createAction<ExtensionsOpenedPayload>('extensions/extensionsOpened');

const extensionsReducer = createReducer(initialExtensionsState, builder => {
	builder.addCase(extensionsOpened, (state, { payload }) => {
		state.extensions = payload.extensions;
	});
});

export default extensionsReducer;
