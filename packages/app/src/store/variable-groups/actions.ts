import { VariableGroups } from '@beak/common/types/beak-project';
import { createAction } from '@reduxjs/toolkit';

import {
	ActionTypes as AT,
	ChangeSelectedGroupPayload,
	IdPayload,
	InsertNewGroupPayload,
	InsertNewItemPayload,
	InsertNewVariableGroupPayload,
	UpdateEntityPayload,
	UpdateValuePayload,
	UpdateVgPayload,
} from './types';

export const startVariableGroups = createAction(AT.START_VARIABLE_GROUPS);
export const variableGroupsOpened = createAction<VariableGroups>(AT.VARIABLE_GROUPS_OPENED);

export const updateVg = createAction<UpdateVgPayload>(AT.UPDATE_VG);
export const removeVg = createAction<string>(AT.REMOVE_VG);

export const updateGroupName = createAction<UpdateEntityPayload>(AT.UPDATE_GROUP_NAME);
export const updateItemName = createAction<UpdateEntityPayload>(AT.UPDATE_ITEM_NAME);
export const updateValue = createAction<UpdateValuePayload>(AT.UPDATE_VALUE);

export const insertNewVariableGroup = createAction<InsertNewVariableGroupPayload>(AT.INSERT_NEW_VARIABLE_GROUP);
export const insertNewGroup = createAction<InsertNewGroupPayload>(AT.INSERT_NEW_GROUP);
export const insertNewItem = createAction<InsertNewItemPayload>(AT.INSERT_NEW_ITEM);
export const removeGroup = createAction<IdPayload>(AT.REMOVE_GROUP);
export const removeItem = createAction<IdPayload>(AT.REMOVE_ITEM);

export const setLatestWrite = createAction<number>(AT.SET_LATEST_WRITE);
export const setWriteDebounce = createAction<string>(AT.SET_WRITE_DEBOUNCE);

export const changeSelectedGroup = createAction<ChangeSelectedGroupPayload>(AT.CHANGE_SELECTED_GROUP_ITEM);

export default {
	startVariableGroups,
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

	setLatestWrite,
	setWriteDebounce,
};
