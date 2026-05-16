import { TypedObject } from '@beak/common/helpers/typescript';
import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';

import * as actions from '../actions';
import type { Alert, AlertScopeMatch, State } from '../types';

/**
 * Scope predicate. Passing only `kind` clears every alert in that bucket;
 * passing the identifier (`requestId`, `folderPath`) narrows to a single
 * row. Used by `alertRemoveForScope` so callers like "tab closed" can
 * sweep without enumerating types.
 */
function scopeMatches(alert: Alert, match: AlertScopeMatch): boolean {
	if (alert.scope.kind !== match.kind) return false;
	if (match.kind === 'request') {
		const id = (match as { requestId?: string }).requestId;
		if (id === undefined) return true;
		return alert.scope.kind === 'request' && alert.scope.requestId === id;
	}
	if (match.kind === 'endpoint') {
		const path = (match as { folderPath?: string }).folderPath;
		if (path === undefined) return true;
		return alert.scope.kind === 'endpoint' && alert.scope.folderPath === path;
	}
	return true;
}

export default function buildAlerts(builder: ActionReducerMapBuilder<State>) {
	builder
		.addCase(actions.alertInsert, (state, { payload }) => {
			state.alerts[payload.ident] = payload.alert;
		})
		.addCase(actions.alertRemove, (state, { payload }) => {
			delete state.alerts[payload];
		})
		.addCase(actions.alertRemoveForScope, (state, { payload }) => {
			for (const ident of TypedObject.keys(state.alerts)) {
				const alert = state.alerts[ident];
				if (alert && scopeMatches(alert, payload)) delete state.alerts[ident];
			}
		})
		.addCase(actions.alertRemoveType, (state, { payload }) => {
			for (const ident of TypedObject.keys(state.alerts)) {
				const alert = state.alerts[ident];
				if (alert?.type === payload) delete state.alerts[ident];
			}
		})
		.addCase(actions.alertClear, state => {
			state.alerts = {};
		});
}
