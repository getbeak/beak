import { TypedObject } from '@beak/common/helpers/typescript';
import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';

import * as actions from '../actions';
import type { State } from '../types';

export default function buildAlerts(builder: ActionReducerMapBuilder<State>) {
	builder
		.addCase(actions.alertInsert, (state, { payload }) => {
			state.alerts[payload.ident] = payload.alert;
		})
		.addCase(actions.alertRemove, (state, { payload }) => {
			state.alerts[payload] = void 0;
		})
		.addCase(actions.alertRemoveDependents, (state, { payload }) => {
			const removeIdents = TypedObject.keys(state.alerts)
				.map(i => {
					const alert = state.alerts[i];
					if (!alert?.dependencies) return null;
					if (alert.dependencies.requestId === payload.requestId) return i;
					return null;
				})
				.filter(Boolean) as unknown as string[];

			removeIdents.forEach(i => {
				state.alerts[i] = void 0;
			});
		})
		.addCase(actions.alertRemoveType, (state, { payload }) => {
			const removeIdents = TypedObject.keys(state.alerts)
				.map(i => {
					const alert = state.alerts[i]!;
					if (alert.type === payload) return i;
					return null;
				})
				.filter(Boolean) as unknown as string[];

			removeIdents.forEach(i => {
				state.alerts[i] = void 0;
			});
		})
		.addCase(actions.alertClear, state => {
			state.alerts = {};
		});
}
