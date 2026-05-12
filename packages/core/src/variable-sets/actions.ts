import { createAction } from '@reduxjs/toolkit';

import type {
	InsertNewGroupPayload,
	InsertNewItemPayload,
	InsertNewVariableSetPayload,
	RemoveGroupPayload,
	RemoveItemPayload,
	UpdateGroupNamePayload,
	UpdateItemNamePayload,
	UpdateValuePayload,
	VariableSetsOpenedPayload,
} from './types';

export const startVariableSets = createAction('variableGroups/startVariableSets');
export const variableSetsOpened = createAction<VariableSetsOpenedPayload>('variableGroups/variableSetsOpened');

export const insertNewVariableSet = createAction<InsertNewVariableSetPayload>(
	'variableGroups/insertNewVariableSet',
);
export const insertNewGroup = createAction<InsertNewGroupPayload>('variableGroups/insertNewGroup');
export const insertNewItem = createAction<InsertNewItemPayload>('variableGroups/insertNewItem');

export const updateGroupName = createAction<UpdateGroupNamePayload>('variableGroups/updateGroupName');
export const updateItemName = createAction<UpdateItemNamePayload>('variableGroups/updateItemName');
export const updateValue = createAction<UpdateValuePayload>('variableGroups/updateValue');

export const removeVariableSetFromStore = createAction<string>('variableGroups/removeVariableSetFromStore');
export const removeGroup = createAction<RemoveGroupPayload>('variableGroups/removeGroup');
export const removeItem = createAction<RemoveItemPayload>('variableGroups/removeItem');
