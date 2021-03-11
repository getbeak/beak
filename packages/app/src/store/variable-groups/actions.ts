import { VariableGroups } from '@beak/common/types/beak-project';
import { createAction } from '@reduxjs/toolkit';

import {
	ActionTypes,
	ChangeSelectedGroupPayload,
	IdPayload,
	InsertNewGroupPayload,
	InsertNewItemPayload,
	InsertNewVariableGroupPayload,
	UpdateEntityPayload,
	UpdateValuePayload,
	UpdateVgPayload,
	VariableGroupsInfoPayload,
} from './types';

export const startVariableGroups = createAction<string>(ActionTypes.START_VARIABLE_GROUPS);
export const variableGroupsInfo = createAction<VariableGroupsInfoPayload>(ActionTypes.VARIABLE_GROUPS_INFO);
export const variableGroupsOpened = createAction<VariableGroups>(ActionTypes.VARIABLE_GROUPS_OPENED);

export const updateVg = createAction<UpdateVgPayload>(ActionTypes.UPDATE_VG);
export const removeVg = createAction<string>(ActionTypes.REMOVE_VG);

export const updateGroupName = createAction<UpdateEntityPayload>(ActionTypes.UPDATE_GROUP_NAME);
export const updateItemName = createAction<UpdateEntityPayload>(ActionTypes.UPDATE_ITEM_NAME);
export const updateValue = createAction<UpdateValuePayload>(ActionTypes.UPDATE_VALUE);

// eslint-disable-next-line max-len
export const insertNewVariableGroup = createAction<InsertNewVariableGroupPayload>(ActionTypes.INSERT_NEW_VARIABLE_GROUP);
export const insertNewGroup = createAction<InsertNewGroupPayload>(ActionTypes.INSERT_NEW_GROUP);
export const insertNewItem = createAction<InsertNewItemPayload>(ActionTypes.INSERT_NEW_ITEM);
export const removeGroup = createAction<IdPayload>(ActionTypes.REMOVE_GROUP);
export const removeItem = createAction<IdPayload>(ActionTypes.REMOVE_ITEM);

export const changeSelectedGroup = createAction<ChangeSelectedGroupPayload>(
	ActionTypes.CHANGE_SELECTED_GROUP_ITEM,
);

export default {
	startVariableGroups,
	variableGroupsInfo,
	variableGroupsOpened,

	updateVg,
	removeVg,

	updateGroupName,
	updateItemName,
	updateValue,

	insertNewVariableGroup,
	insertNewGroup,
	insertNewItem,
	removeGroup,
	removeItem,

	changeSelectedGroup,
};
