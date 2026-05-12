import { buildVariableSetsReducer } from '@beak/core/variable-sets';
import { createReducer } from '@reduxjs/toolkit';

import * as actions from './actions';
import { initialState } from './types';

/**
 * Composes the pure variable-groups reducer from @beak/core with the
 * UI-coupled cases (active rename + file-watch coordination).
 */
const variableGroupsReducer = createReducer(initialState, builder => {
	// Pure variable-groups domain — sourced from @beak/core/variable-groups.
	buildVariableSetsReducer(builder);

	// UI-coupled rename state.
	builder
		.addCase(actions.renameStarted, (state, action) => {
			const { id } = action.payload;
			state.activeRename = { id, name: id };
		})
		.addCase(actions.renameUpdated, (state, action) => {
			const { id, name } = action.payload;
			if (state.activeRename?.id !== id) return;
			state.activeRename.name = name;
		})
		.addCase(actions.renameCancelled, (state, action) => {
			if (state.activeRename?.id === action.payload.id) state.activeRename = void 0;
		})
		.addCase(actions.renameResolved, (state, action) => {
			if (state.activeRename?.id === action.payload.id) state.activeRename = void 0;
		});

	// UI-coupled file-watch coordination.
	builder
		.addCase(actions.setLatestWrite, (state, { payload }) => {
			state.latestWrite = payload;
		})
		.addCase(actions.setWriteDebounce, (state, { payload }) => {
			state.writeDebouncer = payload;
		});
});

export default variableGroupsReducer;
