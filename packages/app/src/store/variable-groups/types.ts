import { ActiveRename } from '@beak/app/features/tree-view/types';
import { ValueParts, VariableGroup, VariableGroups } from '@beak/common/types/beak-project';

export const ActionTypes = {
	START_VARIABLE_GROUPS: '@beak/global/variable-groups/START_VARIABLE_GROUPS',
	VARIABLE_GROUPS_OPENED: '@beak/global/variable-groups/VARIABLE_GROUPS_OPENED',

	UPDATE_VG: '@beak/global/variable-groups/UPDATE_VG',
	REMOVE_VG: '@beak/global/variable-groups/REMOVE_VG',

	UPDATE_GROUP_NAME: '@beak/global/variable-groups/UPDATE_GROUP_NAME',
	UPDATE_ITEM_NAME: '@beak/global/variable-groups/UPDATE_ITEM_NAME',
	UPDATE_VALUE: '@beak/global/variable-groups/UPDATE_VALUE',

	INSERT_NEW_VARIABLE_GROUP: '@beak/global/variable-groups/INSERT_NEW_VARIABLE_GROUP',
	INSERT_NEW_GROUP: '@beak/global/variable-groups/INSERT_NEW_GROUP',
	INSERT_NEW_ITEM: '@beak/global/variable-groups/INSERT_NEW_ITEM',

	REMOVE_GROUP: '@beak/global/variable-groups/REMOVE_GROUP',
	REMOVE_ITEM: '@beak/global/variable-groups/REMOVE_ITEM',

	SET_LATEST_WRITE: '@beak/global/variable-groups/SET_LATEST_WRITE',
	SET_WRITE_DEBOUNCE: '@beak/global/variable-groups/SET_WRITE_DEBOUNCE',

	RENAME_STARTED: '@beak/global/variable-groups/RENAME_STARTED',
	RENAME_UPDATED: '@beak/global/variable-groups/RENAME_UPDATED',
	RENAME_CANCELLED: '@beak/global/variable-groups/RENAME_CANCELLED',
	RENAME_SUBMITTED: '@beak/global/variable-groups/RENAME_SUBMITTED',
	RENAME_RESOLVED: '@beak/global/variable-groups/RENAME_RESOLVED',
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

export interface UpdateVgPayload {
	variableGroupName: string;
	file: VariableGroup;
}

export interface RemoveVgPayload {
	variableGroupName: string;
}

export interface UpdateEntityPayload {
	variableGroupName: string;
	ident: string;
	updated: string;
}

export interface UpdateValuePayload extends Omit<UpdateEntityPayload, 'ident' | 'updated'> {
	groupId: string;
	itemId: string;
	updated: ValueParts;
}

export type InsertNewVariableGroupPayload = { variableGroupName: string } | null;

export interface InsertNewGroupPayload {
	variableGroupName: string;
	group: string;
}

export interface InsertNewItemPayload {
	variableGroupName: string;
	name: string;
}

export interface IdPayload {
	variableGroupName: string;
	id: string;
}

export interface VariableGroupNamePayload {
	variableGroupName: string;
}

export interface VariableGroupRenameStarted extends VariableGroupNamePayload { }
export interface VariableGroupRenameCancelled extends VariableGroupNamePayload { }
export interface VariableGroupRenameSubmitted extends VariableGroupNamePayload { }
export interface VariableGroupRenameResolved extends VariableGroupNamePayload { }
export interface VariableGroupRenameUpdated extends VariableGroupNamePayload { name: string }

export default {
	ActionTypes,
	initialState,
};
