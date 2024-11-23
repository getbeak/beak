import { ActiveRename } from '@beak/ui/features/tree-view/types';
import { ValueSections } from '@beak/ui/features/variables/values';
import type { VariableSet, VariableSets } from '@getbeak/types/variable-sets';

export const ActionTypes = {
	START_VARIABLE_GROUPS: '@beak/global/variable-sets/START_VARIABLE_GROUPS',
	VARIABLE_GROUPS_OPENED: '@beak/global/variable-sets/VARIABLE_GROUPS_OPENED',

	CREATE_NEW_VARIABLE_GROUP: '@beak/global/variable-sets/CREATE_NEW_VARIABLE_GROUP',
	INSERT_NEW_VARIABLE_GROUP: '@beak/global/variable-sets/INSERT_NEW_VARIABLE_GROUP',
	INSERT_NEW_GROUP: '@beak/global/variable-sets/INSERT_NEW_GROUP',
	INSERT_NEW_ITEM: '@beak/global/variable-sets/INSERT_NEW_ITEM',

	UPDATE_GROUP_NAME: '@beak/global/variable-sets/UPDATE_GROUP_NAME',
	UPDATE_ITEM_NAME: '@beak/global/variable-sets/UPDATE_ITEM_NAME',
	UPDATE_VALUE: '@beak/global/variable-sets/UPDATE_VALUE',

	REMOVE_VARIABLE_GROUP_FROM_STORE: '@beak/global/variable-sets/REMOVE_VARIABLE_GROUP_FROM_STORE',
	REMOVE_VARIABLE_GROUP_FROM_DISK: '@beak/global/variable-sets/REMOVE_VARIABLE_GROUP_FROM_DISK',

	REMOVE_GROUP: '@beak/global/variable-sets/REMOVE_GROUP',
	REMOVE_ITEM: '@beak/global/variable-sets/REMOVE_ITEM',

	RENAME_STARTED: '@beak/global/variable-sets/RENAME_STARTED',
	RENAME_UPDATED: '@beak/global/variable-sets/RENAME_UPDATED',
	RENAME_CANCELLED: '@beak/global/variable-sets/RENAME_CANCELLED',
	RENAME_SUBMITTED: '@beak/global/variable-sets/RENAME_SUBMITTED',
	RENAME_RESOLVED: '@beak/global/variable-sets/RENAME_RESOLVED',

	SET_LATEST_WRITE: '@beak/global/variable-sets/SET_LATEST_WRITE',
	SET_WRITE_DEBOUNCE: '@beak/global/variable-sets/SET_WRITE_DEBOUNCE',
};

export interface State {
	loaded: boolean;

	variableSets: VariableSets;

	activeRename?: ActiveRename;
	latestWrite?: number;
	writeDebouncer: string;
}

export const initialState: State = {
	loaded: false,

	variableSets: {},

	latestWrite: 0,
	writeDebouncer: '',
};

export interface VariableSetId { id: string }

export interface VariableSetsOpenedPayload { variableSets: VariableSets }

export interface CreateNewVariableSetPayload { name?: string }
export interface InsertNewVariableSetPayload { id: string; variableSet: VariableSet }
export interface InsertNewGroupPayload extends VariableSetId { setName: string }
export interface InsertNewItemPayload extends VariableSetId { itemName: string }

export interface UpdateGroupNamePayload extends VariableSetId {
	setId: string;
	updatedName: string;
}
export interface UpdateItemNamePayload extends VariableSetId {
	itemId: string;
	updatedName: string;
}
export interface UpdateValuePayload extends VariableSetId {
	setId: string;
	itemId: string;
	updated: ValueSections;
}

export interface RemoveVariableSetFromDiskPayload {
	id: string;
	withConfirmation: boolean;
}

export interface RemoveGroupPayload extends VariableSetId { setId: string }
export interface RemoveItemPayload extends VariableSetId { itemId: string }

export interface VariableSetRenameStarted extends VariableSetId { }
export interface VariableSetRenameCancelled extends VariableSetId { }
export interface VariableSetRenameSubmitted extends VariableSetId { }
export interface VariableSetRenameResolved extends VariableSetId { }
export interface VariableSetRenameUpdated extends VariableSetId { name: string }

export default {
	ActionTypes,
	initialState,
};
