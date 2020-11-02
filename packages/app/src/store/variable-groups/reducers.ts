/* eslint-disable no-param-reassign */
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
			state.opening = false;
			state.variableGroups = action.payload;
		})

		.addCase(actions.updateGroupName, (state, action) => {
			const { name, updated, variableGroup } = action.payload;
			const groups = state.variableGroups![variableGroup].groups;
			const groupIndex = groups.findIndex(i => i === name);

			groups[groupIndex] = updated;

			// return {
			// 	...state,
			// 	variableGroups: {
			// 		...state.variableGroups,
			// 		[variableGroup]: {
			// 			...state.variableGroups![variableGroup],
			// 			groups: { ...groups, [groupIndex]: updated },
			// 		},
			// 	},
			// };
		})
		.addCase(actions.updateItemName, (state, action) => {
			const { name, updated, variableGroup } = action.payload;
			const items = state.variableGroups![variableGroup].items;
			const values = state.variableGroups![variableGroup].values;

			items[items.findIndex(i => i === name)] = updated;

			for (const value of values.filter(v => v.item === name))
				value.item = updated;
		});
});

export default variableGroupsReducer;
