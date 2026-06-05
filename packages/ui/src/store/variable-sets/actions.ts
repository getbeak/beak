// Reducer-bound actions live in @beak/state/variable-sets — re-export so UI shares
// the same action types (otherwise the core reducer never runs).
import {
	duplicateGroup,
	duplicateItem,
	insertNewGroup,
	insertNewItem,
	insertNewVariableSet,
	moveGroup,
	moveItem,
	removeGroup,
	removeItem,
	removeVariableSetFromStore,
	startVariableSets,
	updateGroupName,
	updateItemName,
	updateValue,
	variableSetsOpened,
} from '@beak/state/variable-sets';
import { createAction } from '@reduxjs/toolkit';

export {
	duplicateGroup,
	duplicateItem,
	insertNewGroup,
	insertNewItem,
	insertNewVariableSet,
	moveGroup,
	moveItem,
	removeGroup,
	removeItem,
	removeVariableSetFromStore,
	startVariableSets,
	updateGroupName,
	updateItemName,
	updateValue,
	variableSetsOpened,
};

import {
	ActionTypes as AT,
	type CreateNewVariableSetPayload,
	type RemoveVariableSetFromDiskPayload,
	type VariableSetRenameCancelled,
	type VariableSetRenameResolved,
	type VariableSetRenameStarted,
	type VariableSetRenameSubmitted,
	type VariableSetRenameUpdated,
} from './types';

// UI-only side-effect triggers — listened to by effects, not reduced.
export const createNewVariableSet = createAction<CreateNewVariableSetPayload>(AT.CREATE_NEW_VARIABLE_GROUP);
export const removeVariableSetFromDisk = createAction<RemoveVariableSetFromDiskPayload>(
	AT.REMOVE_VARIABLE_GROUP_FROM_DISK,
);

// UI-only state mutations — handled by the local rename + write-coordination reducer.
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

	duplicateGroup,
	duplicateItem,

	moveGroup,
	moveItem,

	renameStarted,
	renameUpdated,
	renameCancelled,
	renameSubmitted,
	renameResolved,

	setLatestWrite,
	setWriteDebounce,
};
