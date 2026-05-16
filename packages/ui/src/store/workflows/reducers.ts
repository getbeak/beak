import { buildWorkflowsReducer } from '@beak/state/workflows';
import { createReducer } from '@reduxjs/toolkit';

import * as actions from './actions';
import { initialState } from './types';

/**
 * Composes the pure workflows reducer from @beak/state with the UI-coupled
 * cases (file-watch write coordination). Mirrors the variable-sets pattern.
 */
const workflowsReducer = createReducer(initialState, builder => {
	buildWorkflowsReducer(builder);

	builder
		.addCase(actions.setLatestWrite, (state, { payload }) => {
			state.latestWrite = payload;
		})
		.addCase(actions.setWriteDebounce, (state, { payload }) => {
			state.writeDebouncer = payload;
		});
});

export default workflowsReducer;
