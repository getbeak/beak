import { VariableGroups } from '@beak/common/dist/types/beak-project';

export const ActionTypes = {
	OPEN_VARIABLE_GROUPS: '@beak/global/variable-groups/OPEN_VARIABLE_GROUPS',
	VARIABLE_GROUPS_OPENED: '@beak/global/variable-groups/VARIABLE_GROUPS_OPENED',
	START_FS_LISTENER: '@beak/global/variable-groups/START_FS_LISTENER',

	UPDATE_GROUP_NAME: '@beak/global/variable-groups/UPDATE_GROUP_NAME',
	UPDATE_ITEM_NAME: '@beak/global/variable-groups/UPDATE_ITEM_NAME',
	UPDATE_VALUE: '@beak/global/variable-groups/UPDATE_VALUE',

	INSERT_NEW_ITEM: '@beak/global/variable-groups/INSERT_NEW_ITEM',

	CHANGE_SELECTED_GROUP_ITEM: '@beak/global/variable-groups/CHANGE_SELECTED_GROUP_ITEM',
};

export interface State {
	opening: boolean;
	projectPath?: string;
	variableGroups?: VariableGroups;
	selectedGroups: Record<string, string>;
}

export const initialState: State = {
	opening: true,
	selectedGroups: {},
};

export interface VariableGroupsOpenedPayload {
	variableGroups: VariableGroups;
	selectedGroups?: Record<string, string>;
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
