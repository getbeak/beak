import type { ValueSections } from '@getbeak/types/values';
import type { VariableSet, VariableSets } from '@getbeak/types/variable-sets';

/**
 * Pure variable-groups state. UI-layer state (active rename, file-watch
 * coordination) lives in the consuming package, not here.
 */
export interface VariableSetsState {
	loaded: boolean;
	variableSets: VariableSets;
}

export const initialVariableSetsState: VariableSetsState = {
	loaded: false,
	variableSets: {},
};

export interface VariableSetId {
	id: string;
}

export interface VariableSetsOpenedPayload {
	variableSets: VariableSets;
}

export interface InsertNewVariableSetPayload {
	id: string;
	variableSet: VariableSet;
}
export interface InsertNewGroupPayload extends VariableSetId {
	setName: string;
}
export interface InsertNewItemPayload extends VariableSetId {
	itemName: string;
}

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

export interface RemoveGroupPayload extends VariableSetId {
	setId: string;
}
export interface RemoveItemPayload extends VariableSetId {
	itemId: string;
}

/**
 * Compose the variable-group lookup ident.
 */
export function generateValueIdent(setId: string, itemId: string): string {
	return `${setId}&${itemId}`;
}
