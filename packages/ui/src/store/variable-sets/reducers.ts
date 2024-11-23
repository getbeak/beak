import { TypedObject } from '@beak/common/helpers/typescript';
import ksuid from '@beak/ksuid';
import { generateValueIdent } from '@beak/ui/lib/beak-variable-set/utils';
import { createReducer } from '@reduxjs/toolkit';

import * as actions from './actions';
import { initialState } from './types';

const variableSetsReducer = createReducer(initialState, builder => {
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
			state.variableSets![payload.id].sets[ksuid.generate('set').toString()] = payload.setName;
		})
		.addCase(actions.insertNewItem, (state, { payload }) => {
			state.variableSets![payload.id].items[ksuid.generate('item').toString()] = payload.itemName;
		})

		.addCase(actions.updateGroupName, (state, { payload }) => {
			state.variableSets![payload.id].sets[payload.setId] = payload.updatedName;
		})
		.addCase(actions.updateItemName, (state, { payload }) => {
			state.variableSets![payload.id].items[payload.itemId] = payload.updatedName;
		})
		.addCase(actions.updateValue, (state, { payload }) => {
			const { id, setId: setId, itemId, updated } = payload;
			const valueIdentifier = generateValueIdent(setId, itemId);
			const variableSet = state.variableSets[id];
			const exists = variableSet.values[valueIdentifier];
			const empty = updated.length === 0 || (updated.length === 1 && updated[0] === '');

			if (exists) {
				if (empty) {
					delete variableSet.values[valueIdentifier];

					return;
				}

				variableSet.values[valueIdentifier] = updated;
			} else {
				variableSet.values[valueIdentifier] = updated;
			}
		})

		.addCase(actions.removeVariableSetFromStore, (state, { payload }) => {
			delete state.variableSets[payload];
		})

		.addCase(actions.removeGroup, (state, { payload }) => {
			delete state.variableSets[payload.id].sets[payload.setId];

			TypedObject
				.keys(state.variableSets[payload.id].values)
				.filter(k => k.startsWith(`${payload.setId}&`))
				.forEach(k => delete state.variableSets[payload.id].values[k]);
		})
		.addCase(actions.removeItem, (state, { payload }) => {
			delete state.variableSets[payload.id].items[payload.itemId];

			TypedObject
				.keys(state.variableSets[payload.id].values)
				.filter(k => k.endsWith(`&${payload.itemId}`))
				.forEach(k => delete state.variableSets[payload.id].values[k]);
		})

		.addCase(actions.renameStarted, (state, action) => {
			const { id } = action.payload;

			state.activeRename = {
				id,
				name: id,
			};
		})
		.addCase(actions.renameUpdated, (state, action) => {
			const { id, name } = action.payload;

			if (state.activeRename?.id !== id)
				return;

			state.activeRename.name = name;
		})
		.addCase(actions.renameCancelled, (state, action) => {
			if (state.activeRename?.id === action.payload.id)
				state.activeRename = void 0;
		})
		.addCase(actions.renameResolved, (state, action) => {
			if (state.activeRename?.id === action.payload.id)
				state.activeRename = void 0;
		})

		.addCase(actions.setLatestWrite, (state, { payload }) => {
			state.latestWrite = payload;
		})
		.addCase(actions.setWriteDebounce, (state, { payload }) => {
			state.writeDebouncer = payload;
		});
});

export default variableSetsReducer;
