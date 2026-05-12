import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';

import * as actions from '../actions';
import type { State } from '../types';

/**
 * UI-coupled tree cases (rename editing state). The pure tree mutations
 * (insertRequestNode / insertFolderNode / removeNodeFromStore[ByPath]) are
 * registered by @beak/state/project's builder — see reducer/index.ts.
 */
export default function buildTree(builder: ActionReducerMapBuilder<State>) {
	builder
		.addCase(actions.renameStarted, (state, action) => {
			const { requestId } = action.payload;
			const node = state.tree[requestId];
			state.activeRename = { id: requestId, name: node.name };
		})
		.addCase(actions.renameUpdated, (state, action) => {
			const { requestId, name } = action.payload;
			if (state.activeRename?.id !== requestId) return;
			state.activeRename.name = name;
		})
		.addCase(actions.renameCancelled, (state, action) => {
			if (state.activeRename?.id === action.payload.requestId) state.activeRename = void 0;
		})
		.addCase(actions.renameResolved, (state, action) => {
			if (state.activeRename?.id === action.payload.requestId) state.activeRename = void 0;
		});
}
