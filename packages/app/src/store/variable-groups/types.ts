import { VariableGroup, VariableGroups } from '@beak/common/dist/types/beak-project';

export const ActionTypes = {
	START_VARIABLE_GROUPS: '@beak/global/variable-groups/START_VARIABLE_GROUPS',
	VARIABLE_GROUPS_INFO: '@beak/global/variable-groups/VARIABLE_GROUPS_INFO',
	VARIABLE_GROUPS_OPENED: '@beak/global/variable-groups/VARIABLE_GROUPS_OPENED',

	UPDATE_VG: '@beak/global/variable-groups/UPDATE_VG',
	REMOVE_VG: '@beak/global/variable-groups/REMOVE_VG',

	UPDATE_GROUP_NAME: '@beak/global/variable-groups/UPDATE_GROUP_NAME',
	UPDATE_ITEM_NAME: '@beak/global/variable-groups/UPDATE_ITEM_NAME',
	UPDATE_VALUE: '@beak/global/variable-groups/UPDATE_VALUE',

	INSERT_NEW_ITEM: '@beak/global/variable-groups/INSERT_NEW_ITEM',

	CHANGE_SELECTED_GROUP_ITEM: '@beak/global/variable-groups/CHANGE_SELECTED_GROUP_ITEM',
};

export interface State {
	loaded: boolean;

	projectPath?: string;
	variableGroupsPath?: string;
	variableGroups: VariableGroups;

	selectedGroups: Record<string, string>;
}

export const initialState: State = {
	loaded: false,

	variableGroups: {},

	selectedGroups: {},
};

export interface UpdateVgPayload {
	name: string;
	file: VariableGroup;
}

export interface VariableGroupsInfoPayload {
	variableGroupsPath: string;
}

export interface UpdateEntityPayload {
	variableGroup: string;
	ident: string;
	updated: string;
}

export interface UpdateValuePayload extends Omit<UpdateEntityPayload, 'ident'> {
	groupId: string;
	itemId: string;
	ident: string | undefined;
}

export interface InsertNewItemPayload {
	variableGroup: string;
	name: string;
}

export interface ChangeSelectedGroupPayload {
	variableGroup: string;
	group: string;
}

export default {
	ActionTypes,
	initialState,
};
