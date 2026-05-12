import type { ValueParts } from '@getbeak/types/values';
import type { VariableGroup, VariableGroups } from '@getbeak/types/variable-groups';

/**
 * Pure variable-groups state. UI-layer state (active rename, file-watch
 * coordination) lives in the consuming package, not here.
 */
export interface VariableGroupsState {
	loaded: boolean;
	variableGroups: VariableGroups;
}

export const initialVariableGroupsState: VariableGroupsState = {
	loaded: false,
	variableGroups: {},
};

export interface VariableGroupId {
	id: string;
}

export interface VariableGroupsOpenedPayload {
	variableGroups: VariableGroups;
}

export interface InsertNewVariableGroupPayload {
	id: string;
	variableGroup: VariableGroup;
}
export interface InsertNewGroupPayload extends VariableGroupId {
	groupName: string;
}
export interface InsertNewItemPayload extends VariableGroupId {
	itemName: string;
}

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

export interface RemoveGroupPayload extends VariableGroupId {
	groupId: string;
}
export interface RemoveItemPayload extends VariableGroupId {
	itemId: string;
}

/**
 * Compose the variable-group lookup ident.
 */
export function generateValueIdent(groupId: string, itemId: string): string {
	return `${groupId}&${itemId}`;
}
