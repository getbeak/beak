/* eslint-disable max-len */

import { createAction } from '@reduxjs/toolkit';

import {
	ActionTypes as AT,
	CreateNewVariableSetPayload,
	InsertNewGroupPayload,
	InsertNewItemPayload,
	InsertNewVariableSetPayload,
	RemoveGroupPayload,
	RemoveItemPayload,
	RemoveVariableSetFromDiskPayload,
	UpdateGroupNamePayload,
	UpdateItemNamePayload,
	UpdateValuePayload,
	VariableSetRenameCancelled,
	VariableSetRenameResolved,
	VariableSetRenameStarted,
	VariableSetRenameSubmitted,
	VariableSetRenameUpdated,
	VariableSetsOpenedPayload,
} from './types';

export const startVariableSets = createAction(AT.START_VARIABLE_GROUPS);
export const variableSetsOpened = createAction<VariableSetsOpenedPayload>(AT.VARIABLE_GROUPS_OPENED);

export const createNewVariableSet = createAction<CreateNewVariableSetPayload>(AT.CREATE_NEW_VARIABLE_GROUP);
export const insertNewVariableSet = createAction<InsertNewVariableSetPayload>(AT.INSERT_NEW_VARIABLE_GROUP);
export const insertNewGroup = createAction<InsertNewGroupPayload>(AT.INSERT_NEW_GROUP);
export const insertNewItem = createAction<InsertNewItemPayload>(AT.INSERT_NEW_ITEM);

export const updateGroupName = createAction<UpdateGroupNamePayload>(AT.UPDATE_GROUP_NAME);
export const updateItemName = createAction<UpdateItemNamePayload>(AT.UPDATE_ITEM_NAME);
export const updateValue = createAction<UpdateValuePayload>(AT.UPDATE_VALUE);

export const removeVariableSetFromStore = createAction<string>(AT.REMOVE_VARIABLE_GROUP_FROM_STORE);
export const removeVariableSetFromDisk = createAction<RemoveVariableSetFromDiskPayload>(AT.REMOVE_VARIABLE_GROUP_FROM_DISK);

export const removeGroup = createAction<RemoveGroupPayload>(AT.REMOVE_GROUP);
export const removeItem = createAction<RemoveItemPayload>(AT.REMOVE_ITEM);

export const renameStarted = createAction<VariableSetRenameStarted>(AT.RENAME_STARTED);
export const renameUpdated = createAction<VariableSetRenameUpdated>(AT.RENAME_UPDATED);
export const renameCancelled = createAction<VariableSetRenameCancelled>(AT.RENAME_CANCELLED);
export const renameSubmitted = createAction<VariableSetRenameSubmitted>(AT.RENAME_SUBMITTED);
export const renameResolved = createAction<VariableSetRenameResolved>(AT.RENAME_RESOLVED);

export const setLatestWrite = createAction<number>(AT.SET_LATEST_WRITE);
export const setWriteDebounce = createAction<string>(AT.SET_WRITE_DEBOUNCE);

export default {
	startVariableSets,
	variableSetsOpened,

	createNewVariableSet,
	insertNewVariableSet,
	insertNewGroup,
	insertNewItem,

	updateGroupName,
	updateItemName,
	updateValue,

	removeVariableSetFromStore,
	removeVariableSetFromDisk,

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
