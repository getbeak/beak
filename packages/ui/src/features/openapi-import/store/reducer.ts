import { createReducer } from '@reduxjs/toolkit';

import * as actions from './actions';
import { initialState } from './types';

const openApiImportReducer = createReducer(initialState, builder => {
	builder
		.addCase(actions.start, state => {
			state.phase = 'picking-file';
			state.file = undefined;
			state.result = undefined;
		})
		.addCase(actions.filePicked, (state, { payload }) => {
			state.phase = 'picking-folder';
			state.file = payload;
		})
		.addCase(actions.filePickCancelled, state => {
			state.phase = 'idle';
			state.file = undefined;
			state.result = undefined;
		})
		.addCase(actions.folderChosen, (state, { payload }) => {
			state.phase = 'importing';
			state.targetFolder = payload.targetFolder;
		})
		.addCase(actions.importResolved, (state, { payload }) => {
			state.phase = 'result';
			state.result = { ok: true, outcome: payload.outcome, notice: payload.notice };
		})
		.addCase(actions.importRejected, (state, { payload }) => {
			state.phase = 'result';
			state.result = { ok: false, error: payload.error };
		})
		.addCase(actions.close, state => {
			state.phase = 'idle';
			state.file = undefined;
			state.result = undefined;
		});
});

export default openApiImportReducer;
