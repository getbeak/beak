import { createAction } from '@reduxjs/toolkit';

import type {
	InsertNewGroupPayload,
	InsertNewItemPayload,
	InsertNewVariableGroupPayload,
	RemoveGroupPayload,
	RemoveItemPayload,
	UpdateGroupNamePayload,
	UpdateItemNamePayload,
	UpdateValuePayload,
	VariableGroupsOpenedPayload,
} from './types';

export const startVariableGroups = createAction('variableGroups/startVariableGroups');
export const variableGroupsOpened = createAction<VariableGroupsOpenedPayload>('variableGroups/variableGroupsOpened');

export const insertNewVariableGroup = createAction<InsertNewVariableGroupPayload>(
	'variableGroups/insertNewVariableGroup',
);
export const insertNewGroup = createAction<InsertNewGroupPayload>('variableGroups/insertNewGroup');
export const insertNewItem = createAction<InsertNewItemPayload>('variableGroups/insertNewItem');

export const updateGroupName = createAction<UpdateGroupNamePayload>('variableGroups/updateGroupName');
export const updateItemName = createAction<UpdateItemNamePayload>('variableGroups/updateItemName');
export const updateValue = createAction<UpdateValuePayload>('variableGroups/updateValue');

export const removeVariableGroupFromStore = createAction<string>('variableGroups/removeVariableGroupFromStore');
export const removeGroup = createAction<RemoveGroupPayload>('variableGroups/removeGroup');
export const removeItem = createAction<RemoveItemPayload>('variableGroups/removeItem');
