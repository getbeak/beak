import { TypedObject } from '@beak/common/helpers/typescript';
import ksuid from '@beak/ksuid';
import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';

import * as actions from './actions';
import { generateValueIdent, type VariableSetsState } from './types';

/**
 * Attaches the pure variable-groups reducer cases to the given builder. The
 * builder's state type only needs to be a subtype of VariableSetsState — UI
 * packages compose this into a wider state shape (rename, file-watch, etc.).
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
			state.variableSets[payload.id].sets[ksuid.generate('set').toString()] = payload.setName;
		})
		.addCase(actions.insertNewItem, (state, { payload }) => {
			state.variableSets[payload.id].items[ksuid.generate('item').toString()] = payload.itemName;
		})

		.addCase(actions.updateGroupName, (state, { payload }) => {
			state.variableSets[payload.id].sets[payload.setId] = payload.updatedName;
		})
		.addCase(actions.updateItemName, (state, { payload }) => {
			state.variableSets[payload.id].items[payload.itemId] = payload.updatedName;
		})
		.addCase(actions.updateValue, (state, { payload }) => {
			const { id, setId, itemId, updated } = payload;
			const valueIdentifier = generateValueIdent(setId, itemId);
			const variableGroup = state.variableSets[id];
			const empty = updated.length === 0 || (updated.length === 1 && updated[0] === '');

			if (empty) {
				delete variableGroup.values[valueIdentifier];
				return;
			}

			variableGroup.values[valueIdentifier] = updated;
		})

		.addCase(actions.removeVariableSetFromStore, (state, { payload }) => {
			delete state.variableSets[payload];
		})

		.addCase(actions.removeGroup, (state, { payload }) => {
			delete state.variableSets[payload.id].sets[payload.setId];

			TypedObject.keys(state.variableSets[payload.id].values)
				.filter(k => k.startsWith(`${payload.setId}&`))
				.forEach(k => {
				delete state.variableSets[payload.id].values[k];
			});
		})
		.addCase(actions.removeItem, (state, { payload }) => {
			delete state.variableSets[payload.id].items[payload.itemId];

			TypedObject.keys(state.variableSets[payload.id].values)
				.filter(k => k.endsWith(`&${payload.itemId}`))
				.forEach(k => {
				delete state.variableSets[payload.id].values[k];
			});
		});
}
