/* eslint-disable max-len */

import { createAction } from '@reduxjs/toolkit';

import {
	ActionTypes as AT,
	CreateNewVariableGroupPayload,
	InsertNewGroupPayload,
	InsertNewItemPayload,
	InsertNewVariableGroupPayload,
	RemoveGroupPayload,
	RemoveItemPayload,
	RemoveVariableGroupFromDiskPayload,
	UpdateGroupNamePayload,
	UpdateItemNamePayload,
	UpdateValuePayload,
	VariableGroupRenameCancelled,
	VariableGroupRenameResolved,
	VariableGroupRenameStarted,
	VariableGroupRenameSubmitted,
	VariableGroupRenameUpdated,
	VariableGroupsOpenedPayload,
} from './types';

export const startVariableGroups = createAction(AT.START_VARIABLE_GROUPS);
export const variableGroupsOpened = createAction<VariableGroupsOpenedPayload>(AT.VARIABLE_GROUPS_OPENED);

export const createNewVariableGroup = createAction<CreateNewVariableGroupPayload>(AT.CREATE_NEW_VARIABLE_GROUP);
export const insertNewVariableGroup = createAction<InsertNewVariableGroupPayload>(AT.INSERT_NEW_VARIABLE_GROUP);
export const insertNewGroup = createAction<InsertNewGroupPayload>(AT.INSERT_NEW_GROUP);
export const insertNewItem = createAction<InsertNewItemPayload>(AT.INSERT_NEW_ITEM);

export const updateGroupName = createAction<UpdateGroupNamePayload>(AT.UPDATE_GROUP_NAME);
export const updateItemName = createAction<UpdateItemNamePayload>(AT.UPDATE_ITEM_NAME);
export const updateValue = createAction<UpdateValuePayload>(AT.UPDATE_VALUE);

export const removeVariableGroupFromStore = createAction<string>(AT.REMOVE_VARIABLE_GROUP_FROM_STORE);
export const removeVariableGroupFromDisk = createAction<RemoveVariableGroupFromDiskPayload>(AT.REMOVE_VARIABLE_GROUP_FROM_DISK);

export const removeGroup = createAction<RemoveGroupPayload>(AT.REMOVE_GROUP);
export const removeItem = createAction<RemoveItemPayload>(AT.REMOVE_ITEM);

export const renameStarted = createAction<VariableGroupRenameStarted>(AT.RENAME_STARTED);
export const renameUpdated = createAction<VariableGroupRenameUpdated>(AT.RENAME_UPDATED);
export const renameCancelled = createAction<VariableGroupRenameCancelled>(AT.RENAME_CANCELLED);
export const renameSubmitted = createAction<VariableGroupRenameSubmitted>(AT.RENAME_SUBMITTED);
export const renameResolved = createAction<VariableGroupRenameResolved>(AT.RENAME_RESOLVED);

export const setLatestWrite = createAction<number>(AT.SET_LATEST_WRITE);
export const setWriteDebounce = createAction<string>(AT.SET_WRITE_DEBOUNCE);

export default {
	startVariableGroups,
	variableGroupsOpened,

	createNewVariableGroup,
	insertNewVariableGroup,
	insertNewGroup,
	insertNewItem,

	updateGroupName,
	updateItemName,
	updateValue,

	removeVariableGroupFromStore,
	removeVariableGroupFromDisk,

	removeGroup,
	removeItem,

	renameStarted,
	renameUpdated,
	renameCancelled,
	renameSubmitted,
	renameResolved,

	setLatestWrite,
	setWriteDebounce,
};
