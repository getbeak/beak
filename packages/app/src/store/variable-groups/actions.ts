import { createAction } from '@reduxjs/toolkit';

import {
	ActionTypes,
	ChangeSelectedGroupPayload,
	InsertNewItemPayload,
	UpdateEntityPayload,
	UpdateValuePayload,
	VariableGroupsOpenedPayload,
} from './types';

export const openVariableGroups = createAction<string>(ActionTypes.OPEN_VARIABLE_GROUPS);
export const variableGroupsOpened = createAction<VariableGroupsOpenedPayload>(ActionTypes.VARIABLE_GROUPS_OPENED);
export const startFsListener = createAction(ActionTypes.START_FS_LISTENER);

export const updateGroupName = createAction<UpdateEntityPayload>(ActionTypes.UPDATE_GROUP_NAME);
export const updateItemName = createAction<UpdateEntityPayload>(ActionTypes.UPDATE_ITEM_NAME);
export const updateValue = createAction<UpdateValuePayload>(ActionTypes.UPDATE_VALUE);

export const insertNewItem = createAction<InsertNewItemPayload>(ActionTypes.INSERT_NEW_ITEM);

export const changeSelectedGroup = createAction<ChangeSelectedGroupPayload>(
	ActionTypes.CHANGE_SELECTED_GROUP_ITEM,
);

export default {
	openVariableGroups,
	variableGroupsOpened,
	startFsListener,

	updateGroupName,
	updateItemName,
	updateValue,

	insertNewItem,
	changeSelectedGroup,
};
