import { VariableGroups } from '@beak/common/dist/types/beak-project';
import { createAction } from '@reduxjs/toolkit';

import {
	ActionTypes, UpdateEntityNamePayload,
} from './types';

export const openVariableGroups = createAction<string>(ActionTypes.OPEN_VARIABLE_GROUPS);
export const variableGroupsOpened = createAction<VariableGroups>(ActionTypes.VARIABLE_GROUPS_OPENED);

export const updateGroupName = createAction<UpdateEntityNamePayload>(ActionTypes.UPDATE_GROUP_NAME);
export const updateItemName = createAction<UpdateEntityNamePayload>(ActionTypes.UPDATE_ITEM_NAME);

export default {
	openVariableGroups,
	variableGroupsOpened,

	updateGroupName,
	updateItemName,
};
