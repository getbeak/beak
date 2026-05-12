import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';

import * as actions from '../actions';
import type { State } from '../types';

/**
 * UI-coupled lifecycle cases. The pure tree lifecycle (startProject /
 * insertProjectInfo / projectOpened) is registered by @beak/core/project's
 * builder — see reducer/index.ts.
 */
export default function buildLifecycle(builder: ActionReducerMapBuilder<State>) {
	builder
		.addCase(actions.setLatestWrite, (state, { payload }) => {
			state.latestWrite = payload;
		})
		.addCase(actions.setWriteDebounce, (state, { payload }) => {
			state.writeDebouncer[payload.requestId] = payload.nonce;
		});
}
