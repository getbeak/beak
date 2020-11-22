/* eslint-disable no-param-reassign */
// @ts-ignore
import ksuid from '@cuvva/ksuid';
import { createReducer } from '@reduxjs/toolkit';

import * as actions from './actions';
import { initialState } from './types';

const variableGroupsReducer = createReducer(initialState, builder => {
	builder
		.addCase(actions.openVariableGroups, (state, action) => {
			state.opening = true;
			state.projectPath = action.payload;
		})
		.addCase(actions.variableGroupsOpened, (state, action) => {
			state.variableGroups = action.payload.variableGroups;

			if (action.payload.selectedGroups)
				state.selectedGroups = action.payload.selectedGroups;

			state.opening = false;
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
