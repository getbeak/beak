import { TypedObject } from '@beak/common/helpers/typescript';
import ksuid from '@beak/ksuid';
import { generateValueIdent } from '@beak/ui/lib/beak-variable-group/utils';
import { createReducer } from '@reduxjs/toolkit';

import * as actions from './actions';
import { initialState } from './types';

const variableGroupsReducer = createReducer(initialState, builder => {
	builder
		.addCase(actions.startVariableGroups, state => {
			state.loaded = false;
		})
		.addCase(actions.variableGroupsOpened, (state, { payload }) => {
			state.variableGroups = payload.variableGroups;
			state.loaded = true;
		})

		.addCase(actions.insertNewVariableGroup, (state, { payload }) => {
			state.variableGroups[payload.id] = payload.variableGroup;
		})
		.addCase(actions.insertNewGroup, (state, { payload }) => {
			state.variableGroups![payload.id].groups[ksuid.generate('group').toString()] = payload.groupName;
		})
		.addCase(actions.insertNewItem, (state, { payload }) => {
			state.variableGroups![payload.id].items[ksuid.generate('item').toString()] = payload.itemName;
		})

		.addCase(actions.updateGroupName, (state, { payload }) => {
			state.variableGroups![payload.id].groups[payload.groupId] = payload.updatedName;
		})
		.addCase(actions.updateItemName, (state, { payload }) => {
			state.variableGroups![payload.id].items[payload.itemId] = payload.updatedName;
		})
		.addCase(actions.updateValue, (state, { payload }) => {
			const { id, groupId, itemId, updated } = payload;
			const valueIdentifier = generateValueIdent(groupId, itemId);
			const variableGroup = state.variableGroups[id];
			const exists = variableGroup.values[valueIdentifier];
			const empty = updated.length === 0 || (updated.length === 1 && updated[0] === '');

			if (exists) {
				if (empty) {
					delete variableGroup.values[valueIdentifier];

					return;
				}

				variableGroup.values[valueIdentifier] = updated;
			} else {
				variableGroup.values[valueIdentifier] = updated;
			}
		})

		.addCase(actions.removeVariableGroupFromStore, (state, { payload }) => {
			delete state.variableGroups[payload];
		})

		.addCase(actions.removeGroup, (state, { payload }) => {
			delete state.variableGroups[payload.id].groups[payload.groupId];

			TypedObject
				.keys(state.variableGroups[payload.id].values)
				.filter(k => k.startsWith(`${payload.groupId}&`))
				.forEach(k => delete state.variableGroups[payload.id].values[k]);
		})
		.addCase(actions.removeItem, (state, { payload }) => {
			delete state.variableGroups[payload.id].items[payload.itemId];

			TypedObject
				.keys(state.variableGroups[payload.id].values)
				.filter(k => k.endsWith(`&${payload.itemId}`))
				.forEach(k => delete state.variableGroups[payload.id].values[k]);
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

export default variableGroupsReducer;
