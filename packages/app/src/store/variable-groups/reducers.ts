/* eslint-disable no-param-reassign */
import { generateValueIdent } from '@beak/app/lib/beak-variable-group/utils';
import { TypedObject } from '@beak/common/helpers/typescript';
import ksuid from '@cuvva/ksuid';
import { createReducer } from '@reduxjs/toolkit';

import * as actions from './actions';
import { initialState } from './types';

const variableGroupsReducer = createReducer(initialState, builder => {
	builder
		.addCase(actions.startVariableGroups, state => {
			state.loaded = false;
		})
		.addCase(actions.variableGroupsOpened, (state, { payload }) => {
			state.variableGroups = payload;
			state.loaded = true;
		})

		.addCase(actions.updateVg, (state, { payload }) => {
			const { variableGroupName, file } = payload;

			state.variableGroups[variableGroupName] = file;
		})
		.addCase(actions.removeVg, (state, { payload }) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { [payload.variableGroupName]: remove, ...rest } = state.variableGroups;

			state.variableGroups = rest;
		})

		.addCase(actions.updateGroupName, (state, action) => {
			const { ident, updated, variableGroupName } = action.payload;

			state.variableGroups![variableGroupName].groups[ident] = updated;
		})
		.addCase(actions.updateItemName, (state, action) => {
			const { ident, updated, variableGroupName } = action.payload;

			state.variableGroups![variableGroupName].items[ident] = updated;
		})
		.addCase(actions.updateValue, (state, action) => {
			const { groupId, itemId, updated, variableGroupName } = action.payload;
			const ident = generateValueIdent(groupId, itemId);
			const vg = state.variableGroups![variableGroupName];
			const exists = ident !== void 0 && vg.values[ident];
			const empty = updated.length === 0 || (updated.length === 1 && updated[0] === '');

			if (exists) {
				if (empty) {
					delete vg.values[ident!];

					return;
				}

				vg.values[ident!] = updated;
			} else {
				vg.values[ident] = updated;
			}
		})

		.addCase(actions.insertNewVariableGroup, (state, action) => {
			if (action.payload === null) {
				const groupId = ksuid.generate('group').toString();
				const itemId = ksuid.generate('item').toString();

				state.variableGroups!.Environment = {
					groups: { [groupId]: 'Production' },
					items: { [itemId]: 'env_identifier' },
					values: { [`${groupId}&${itemId}`]: ['prod'] },
				};

				return;
			}

			const { variableGroupName } = action.payload;
			const groupId = ksuid.generate('group').toString();
			const itemId = ksuid.generate('item').toString();

			state.variableGroups![variableGroupName] = {
				groups: { [groupId]: 'Group' },
				items: { [itemId]: 'Item' },
				values: { },
			};
		})
		.addCase(actions.insertNewGroup, (state, action) => {
			const { group, variableGroupName } = action.payload;

			state.variableGroups![variableGroupName].groups[ksuid.generate('group').toString()] = group;
		})
		.addCase(actions.insertNewItem, (state, action) => {
			const { name, variableGroupName } = action.payload;

			state.variableGroups![variableGroupName].items[ksuid.generate('item').toString()] = name;
		})
		.addCase(actions.removeGroup, (state, action) => {
			const { id, variableGroupName } = action.payload;

			TypedObject
				.keys(state.variableGroups[variableGroupName].values)
				.filter(k => k.startsWith(id))
				.forEach(k => {
					// @ts-expect-error
					state.variableGroups[variableGroupName].values[k] = void 0;
				});

			delete state.variableGroups![variableGroupName].groups[id];
		})
		.addCase(actions.removeItem, (state, action) => {
			const { id, variableGroupName } = action.payload;

			TypedObject
				.keys(state.variableGroups[variableGroupName].values)
				.filter(k => k.endsWith(id))
				.forEach(k => {
					// @ts-expect-error
					state.variableGroups[variableGroupName].values[k] = void 0;
				});

			delete state.variableGroups![variableGroupName].items[id];
		})

		.addCase(actions.setLatestWrite, (state, { payload }) => {
			state.latestWrite = payload;
		})
		.addCase(actions.setWriteDebounce, (state, { payload }) => {
			state.writeDebouncer = payload;
		})

		.addCase(actions.renameStarted, (state, action) => {
			const { variableGroupName } = action.payload;

			state.activeRename = {
				variableGroupName,
				updatedName: variableGroupName,
			};
		})
		.addCase(actions.renameUpdated, (state, action) => {
			const { variableGroupName, updatedName } = action.payload;

			if (state.activeRename?.variableGroupName !== variableGroupName)
				return;

			state.activeRename.updatedName = updatedName;
		})
		.addCase(actions.renameCancelled, (state, action) => {
			if (state.activeRename?.variableGroupName === action.payload.variableGroupName)
				state.activeRename = void 0;
		})
		.addCase(actions.renameResolved, (state, action) => {
			if (state.activeRename?.variableGroupName === action.payload.variableGroupName)
				state.activeRename = void 0;
		});
});

export default variableGroupsReducer;
