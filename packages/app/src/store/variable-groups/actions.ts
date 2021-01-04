import { VariableGroups } from '@beak/common/types/beak-project';
import { createAction } from '@reduxjs/toolkit';

import {
	ActionTypes,
	ChangeSelectedGroupPayload,
	InsertNewItemPayload,
	UpdateEntityPayload,
	UpdateValuePayload,
	UpdateVgPayload,
	VariableGroupsInfoPayload,
} from './types';

export const startVariableGroups = createAction<string>(ActionTypes.START_VARIABLE_GROUPS);
export const variableGroupsInfo = createAction<VariableGroupsInfoPayload>(ActionTypes.VARIABLE_GROUPS_INFO);
export const insertScanItem = createAction<string>(ActionTypes.INSERT_SCAN_ITEM);
export const initialScanComplete = createAction<string[]>(ActionTypes.INITIAL_SCAN_COMPLETE);
export const variableGroupsOpened = createAction<VariableGroups>(ActionTypes.VARIABLE_GROUPS_OPENED);

export const updateVg = createAction<UpdateVgPayload>(ActionTypes.UPDATE_VG);
export const removeVg = createAction<string>(ActionTypes.REMOVE_VG);

export const updateGroupName = createAction<UpdateEntityPayload>(ActionTypes.UPDATE_GROUP_NAME);
export const updateItemName = createAction<UpdateEntityPayload>(ActionTypes.UPDATE_ITEM_NAME);
export const updateValue = createAction<UpdateValuePayload>(ActionTypes.UPDATE_VALUE);

export const insertNewItem = createAction<InsertNewItemPayload>(ActionTypes.INSERT_NEW_ITEM);
export const changeSelectedGroup = createAction<ChangeSelectedGroupPayload>(
	ActionTypes.CHANGE_SELECTED_GROUP_ITEM,
);

export default {
	startVariableGroups,
	variableGroupsInfo,
	insertScanItem,
	initialScanComplete,
	variableGroupsOpened,

	updateVg,
	removeVg,

	updateGroupName,
	updateItemName,
	updateValue,

	insertNewItem,
	changeSelectedGroup,
};
