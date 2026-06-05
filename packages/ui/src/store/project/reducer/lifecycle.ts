import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';

import * as actions from '../actions';
import type { State } from '../types';

/**
 * UI-coupled lifecycle cases. The pure tree lifecycle (startProject /
 * insertProjectInfo / projectOpened) is registered by @beak/state/project's
 * builder — see reducer/index.ts.
 */
export default function buildLifecycle(builder: ActionReducerMapBuilder<State>) {
	builder
		.addCase(actions.setLatestWrite, (state, { payload }) => {
			state.latestWrite = payload;
		})
		.addCase(actions.setWriteDebounce, (state, { payload }) => {
			state.writeDebouncer[payload.requestId] = payload.nonce;
		})
		.addCase(actions.linkedDirtyMarked, (state, { payload }) => {
			state.linkedDirty[payload.requestId] = true;
		})
		.addCase(actions.linkedDirtyCleared, (state, { payload }) => {
			delete state.linkedDirty[payload.requestId];
		})
		.addCase(actions.linkedStaleMarked, (state, { payload }) => {
			state.linkedStale[payload.requestId] = true;
		})
		.addCase(actions.linkedStaleCleared, (state, { payload }) => {
			delete state.linkedStale[payload.requestId];
		})
		.addCase(actions.unlinkConfirmShow, (state, { payload }) => {
			state.pendingUnlinkConfirm = { requestId: payload.requestId };
		})
		.addCase(actions.unlinkConfirmDismiss, state => {
			state.pendingUnlinkConfirm = undefined;
		})
		.addCase(actions.staleReloadShow, (state, { payload }) => {
			state.pendingStaleReload = { requestId: payload.requestId };
		})
		.addCase(actions.staleReloadDismiss, state => {
			state.pendingStaleReload = undefined;
		});
}
