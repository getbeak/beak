/* eslint-disable no-param-reassign */
// @ts-ignore
import ksuid from '@cuvva/ksuid';
import { createReducer } from '@reduxjs/toolkit';

import * as actions from './actions';
import { initialState } from './types';

const variableGroupsReducer = createReducer(initialState, builder => {
	builder
		.addCase(actions.startVariableGroups, (state, action) => {
			state.loaded = false;
			state.projectPath = action.payload;
		})
		.addCase(actions.variableGroupsInfo, (state, { payload }) => {
			state.variableGroupsPath = payload.variableGroupsPath;
		})
		.addCase(actions.insertScanItem, (state, { payload }) => {
			state.initialScan?.push(payload);
		})
		.addCase(actions.initialScanComplete, state => {
			state.initialScan = null;
		})
		.addCase(actions.variableGroupsOpened, (state, { payload }) => {
			state.variableGroups = payload;
			state.loaded = true;
		})

		.addCase(actions.updateVg, (state, { payload }) => {
			const { name, file } = payload;

			state.variableGroups[name] = file;
		})
		.addCase(actions.removeVg, (state, { payload }) => {
			const { [payload]: remove, ...rest } = state.variableGroups;

			state.variableGroups = rest;
		})

		.addCase(actions.updateGroupName, (state, action) => {
			const { ident, updated, variableGroup } = action.payload;

			state.variableGroups![variableGroup].groups[ident] = updated;
		})
		.addCase(actions.updateItemName, (state, action) => {
			const { ident, updated, variableGroup } = action.payload;

			state.variableGroups![variableGroup].items[ident] = updated;
		})
		.addCase(actions.updateValue, (state, action) => {
			const { groupId, itemId, ident, updated, variableGroup } = action.payload;
			const vg = state.variableGroups![variableGroup];
			const exists = ident !== void 0 && vg.values[ident];
			const empty = updated === '';

			if (exists) {
				if (empty) {
					delete vg.values[ident!];

					return;
				}

				vg.values[ident!].value = updated;
			} else {
				vg.values[ksuid.generate('value').toString()] = {
					groupId,
					itemId,
					value: updated,
				};
			}
		})

		.addCase(actions.insertNewItem, (state, action) => {
			const { name, variableGroup } = action.payload;

			state.variableGroups![variableGroup].items[ksuid.generate('item').toString()] = name;
		})
		.addCase(actions.changeSelectedGroup, (state, action) => {
			const { group, variableGroup } = action.payload;

			state.selectedGroups[variableGroup] = group;
		});
});

export default variableGroupsReducer;
