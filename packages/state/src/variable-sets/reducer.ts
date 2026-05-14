import { TypedObject } from '@beak/common/helpers/typescript';
import ksuid from '@beak/ksuid';
import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';

import * as actions from './actions';
import { generateValueIdent, type VariableSetsState } from './types';

/**
 * Attaches the pure variable-sets reducer cases to the given builder. The
 * builder's state type only needs to be a subtype of VariableSetsState — UI
 * packages compose this into a wider state shape (rename, file-watch, etc.).
 *
 * Every mutating case guards the target set first: a stale rename/remove can
 * easily arrive after `removeVariableSetFromStore` has fired (file-watch
 * deletion, undo replay), and crashing the store on a no-op is worse than
 * dropping the action.
 */
export function buildVariableSetsReducer<S extends VariableSetsState>(builder: ActionReducerMapBuilder<S>) {
	builder
		.addCase(actions.startVariableSets, state => {
			state.loaded = false;
		})
		.addCase(actions.variableSetsOpened, (state, { payload }) => {
			state.variableSets = payload.variableSets;
			state.loaded = true;
		})

		.addCase(actions.insertNewVariableSet, (state, { payload }) => {
			state.variableSets[payload.id] = payload.variableSet;
		})
		.addCase(actions.insertNewGroup, (state, { payload }) => {
			const variableSet = state.variableSets[payload.id];
			if (!variableSet) return;
			variableSet.sets[ksuid.generate('set').toString()] = payload.setName;
		})
		.addCase(actions.insertNewItem, (state, { payload }) => {
			const variableSet = state.variableSets[payload.id];
			if (!variableSet) return;
			variableSet.items[ksuid.generate('item').toString()] = payload.itemName;
		})

		.addCase(actions.updateGroupName, (state, { payload }) => {
			const variableSet = state.variableSets[payload.id];
			if (!variableSet || !(payload.setId in variableSet.sets)) return;
			variableSet.sets[payload.setId] = payload.updatedName;
		})
		.addCase(actions.updateItemName, (state, { payload }) => {
			const variableSet = state.variableSets[payload.id];
			if (!variableSet || !(payload.itemId in variableSet.items)) return;
			variableSet.items[payload.itemId] = payload.updatedName;
		})
		.addCase(actions.updateValue, (state, { payload }) => {
			const { id, setId, itemId, updated } = payload;
			const variableSet = state.variableSets[id];
			if (!variableSet) return;

			const valueIdentifier = generateValueIdent(setId, itemId);
			const empty = updated.length === 0 || (updated.length === 1 && updated[0] === '');

			if (empty) {
				delete variableSet.values[valueIdentifier];
				return;
			}

			variableSet.values[valueIdentifier] = updated;
		})

		.addCase(actions.removeVariableSetFromStore, (state, { payload }) => {
			delete state.variableSets[payload];
		})

		.addCase(actions.removeGroup, (state, { payload }) => {
			const variableSet = state.variableSets[payload.id];
			if (!variableSet) return;

			delete variableSet.sets[payload.setId];

			TypedObject.keys(variableSet.values)
				.filter(k => k.startsWith(`${payload.setId}&`))
				.forEach(k => {
					delete variableSet.values[k];
				});
		})
		.addCase(actions.removeItem, (state, { payload }) => {
			const variableSet = state.variableSets[payload.id];
			if (!variableSet) return;

			delete variableSet.items[payload.itemId];

			TypedObject.keys(variableSet.values)
				.filter(k => k.endsWith(`&${payload.itemId}`))
				.forEach(k => {
					delete variableSet.values[k];
				});
		});
}
