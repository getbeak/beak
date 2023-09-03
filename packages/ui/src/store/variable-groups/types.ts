import { ValueParts } from '@beak/ui/features/realtime-values/values';
import { ActiveRename } from '@beak/ui/features/tree-view/types';
import type { VariableGroup, VariableGroups } from '@getbeak/types/variable-groups';

export const ActionTypes = {
	START_VARIABLE_GROUPS: '@beak/global/variable-groups/START_VARIABLE_GROUPS',
	VARIABLE_GROUPS_OPENED: '@beak/global/variable-groups/VARIABLE_GROUPS_OPENED',

	CREATE_NEW_VARIABLE_GROUP: '@beak/global/variable-groups/CREATE_NEW_VARIABLE_GROUP',
	INSERT_NEW_VARIABLE_GROUP: '@beak/global/variable-groups/INSERT_NEW_VARIABLE_GROUP',
	INSERT_NEW_GROUP: '@beak/global/variable-groups/INSERT_NEW_GROUP',
	INSERT_NEW_ITEM: '@beak/global/variable-groups/INSERT_NEW_ITEM',

	UPDATE_GROUP_NAME: '@beak/global/variable-groups/UPDATE_GROUP_NAME',
	UPDATE_ITEM_NAME: '@beak/global/variable-groups/UPDATE_ITEM_NAME',
	UPDATE_VALUE: '@beak/global/variable-groups/UPDATE_VALUE',

	REMOVE_VARIABLE_GROUP_FROM_STORE: '@beak/global/variable-groups/REMOVE_VARIABLE_GROUP_FROM_STORE',
	REMOVE_VARIABLE_GROUP_FROM_DISK: '@beak/global/variable-groups/REMOVE_VARIABLE_GROUP_FROM_DISK',

	REMOVE_GROUP: '@beak/global/variable-groups/REMOVE_GROUP',
	REMOVE_ITEM: '@beak/global/variable-groups/REMOVE_ITEM',

	RENAME_STARTED: '@beak/global/variable-groups/RENAME_STARTED',
	RENAME_UPDATED: '@beak/global/variable-groups/RENAME_UPDATED',
	RENAME_CANCELLED: '@beak/global/variable-groups/RENAME_CANCELLED',
	RENAME_SUBMITTED: '@beak/global/variable-groups/RENAME_SUBMITTED',
	RENAME_RESOLVED: '@beak/global/variable-groups/RENAME_RESOLVED',

	SET_LATEST_WRITE: '@beak/global/variable-groups/SET_LATEST_WRITE',
	SET_WRITE_DEBOUNCE: '@beak/global/variable-groups/SET_WRITE_DEBOUNCE',
};

export interface State {
	loaded: boolean;

	variableGroups: VariableGroups;

	activeRename?: ActiveRename;
	latestWrite?: number;
	writeDebouncer: string;
}

export const initialState: State = {
	loaded: false,

	variableGroups: {},

	latestWrite: 0,
	writeDebouncer: '',
};

export interface VariableGroupId { id: string }

export interface VariableGroupsOpenedPayload { variableGroups: VariableGroups }

export interface CreateNewVariableGroupPayload { name?: string }
export interface InsertNewVariableGroupPayload { id: string; variableGroup: VariableGroup }
export interface InsertNewGroupPayload extends VariableGroupId { groupName: string }
export interface InsertNewItemPayload extends VariableGroupId { itemName: string }

export interface UpdateGroupNamePayload extends VariableGroupId {
	groupId: string;
	updatedName: string;
}
export interface UpdateItemNamePayload extends VariableGroupId {
	itemId: string;
	updatedName: string;
}
export interface UpdateValuePayload extends VariableGroupId {
	groupId: string;
	itemId: string;
	updated: ValueParts;
}

export interface RemoveVariableGroupFromDiskPayload {
	id: string;
	withConfirmation: boolean;
}

export interface RemoveGroupPayload extends VariableGroupId { groupId: string }
export interface RemoveItemPayload extends VariableGroupId { itemId: string }

export interface VariableGroupRenameStarted extends VariableGroupId { }
export interface VariableGroupRenameCancelled extends VariableGroupId { }
export interface VariableGroupRenameSubmitted extends VariableGroupId { }
export interface VariableGroupRenameResolved extends VariableGroupId { }
export interface VariableGroupRenameUpdated extends VariableGroupId { name: string }

export default {
	ActionTypes,
	initialState,
};
