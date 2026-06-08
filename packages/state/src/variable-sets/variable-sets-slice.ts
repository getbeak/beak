import { TypedObject } from '@beak/common/helpers/typescript';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import * as actions from './actions';
import { insertKeyAfter, reorderRecord, uniqueName } from './helpers';
import { generateValueIdent, initialVariableSetsState, type VariableSetsState } from './types';
import type {
	DuplicateGroupPayload,
	DuplicateItemPayload,
	InsertNewGroupPayload,
	InsertNewItemPayload,
	InsertNewVariableSetPayload,
	MoveGroupPayload,
	MoveItemPayload,
	RemoveGroupPayload,
	RemoveItemPayload,
	UpdateGroupNamePayload,
	UpdateItemNamePayload,
	UpdateValuePayload,
	VariableSetsOpenedPayload,
} from './types';

// ---------------------------------------------------------------------------
// Per-case reducer functions (exported for reuse in buildVariableSetsReducer)
// ---------------------------------------------------------------------------

export function reduceStartVariableSets(state: VariableSetsState) {
	state.loaded = false;
}

export function reduceVariableSetsOpened(state: VariableSetsState, { payload }: PayloadAction<VariableSetsOpenedPayload>) {
	state.variableSets = payload.variableSets;
	state.loaded = true;
}

export function reduceInsertNewVariableSet(state: VariableSetsState, { payload }: PayloadAction<InsertNewVariableSetPayload>) {
	state.variableSets[payload.id] = payload.variableSet;
}

export function reduceInsertNewGroup(state: VariableSetsState, { payload }: PayloadAction<InsertNewGroupPayload>) {
	const variableSet = state.variableSets[payload.id];
	if (!variableSet) return;
	variableSet.sets[payload.setId] = payload.setName;
}

export function reduceInsertNewItem(state: VariableSetsState, { payload }: PayloadAction<InsertNewItemPayload>) {
	const variableSet = state.variableSets[payload.id];
	if (!variableSet) return;
	variableSet.items[payload.itemId] = payload.itemName;
}

export function reduceUpdateGroupName(state: VariableSetsState, { payload }: PayloadAction<UpdateGroupNamePayload>) {
	const variableSet = state.variableSets[payload.id];
	if (!variableSet || !(payload.setId in variableSet.sets)) return;
	variableSet.sets[payload.setId] = payload.updatedName;
}

export function reduceUpdateItemName(state: VariableSetsState, { payload }: PayloadAction<UpdateItemNamePayload>) {
	const variableSet = state.variableSets[payload.id];
	if (!variableSet || !(payload.itemId in variableSet.items)) return;
	variableSet.items[payload.itemId] = payload.updatedName;
}

export function reduceUpdateValue(state: VariableSetsState, { payload }: PayloadAction<UpdateValuePayload>) {
	const { id, setId, itemId, updated } = payload;
	const variableSet = state.variableSets[id];
	if (!variableSet) return;

	const valueIdentifier = generateValueIdent(setId, itemId);
	const empty = updated.length === 0 || (updated.length === 1 && updated[0] === '');

	if (empty) {
		delete variableSet.values[valueIdentifier];
		return;
	}

	variableSet.values[valueIdentifier] = updated;
}

export function reduceRemoveVariableSetFromStore(state: VariableSetsState, { payload }: PayloadAction<string>) {
	delete state.variableSets[payload];
}

export function reduceRemoveGroup(state: VariableSetsState, { payload }: PayloadAction<RemoveGroupPayload>) {
	const variableSet = state.variableSets[payload.id];
	if (!variableSet) return;

	delete variableSet.sets[payload.setId];

	TypedObject.keys(variableSet.values)
		.filter((k: string) => k.startsWith(`${payload.setId}&`))
		.forEach((k: string) => {
			delete variableSet.values[k];
		});
}

export function reduceRemoveItem(state: VariableSetsState, { payload }: PayloadAction<RemoveItemPayload>) {
	const variableSet = state.variableSets[payload.id];
	if (!variableSet) return;

	delete variableSet.items[payload.itemId];

	TypedObject.keys(variableSet.values)
		.filter((k: string) => k.endsWith(`&${payload.itemId}`))
		.forEach((k: string) => {
			delete variableSet.values[k];
		});
}

export function reduceDuplicateItem(state: VariableSetsState, { payload }: PayloadAction<DuplicateItemPayload>) {
	const variableSet = state.variableSets[payload.id];
	if (!variableSet || !(payload.itemId in variableSet.items)) return;

	const sourceName = variableSet.items[payload.itemId];
	const newItemId = payload.newItemId;
	const newName = uniqueName(`${sourceName} copy`, TypedObject.values(variableSet.items), payload.now);

	variableSet.items = insertKeyAfter(variableSet.items, payload.itemId, newItemId, newName);

	for (const setId of TypedObject.keys(variableSet.sets)) {
		const sourceIdent = generateValueIdent(setId, payload.itemId);
		const sourceValue = variableSet.values[sourceIdent];
		if (sourceValue === undefined) continue;
		variableSet.values[generateValueIdent(setId, newItemId)] = [...sourceValue];
	}
}

export function reduceDuplicateGroup(state: VariableSetsState, { payload }: PayloadAction<DuplicateGroupPayload>) {
	const variableSet = state.variableSets[payload.id];
	if (!variableSet || !(payload.setId in variableSet.sets)) return;

	const sourceName = variableSet.sets[payload.setId];
	const newSetId = payload.newSetId;
	const newName = uniqueName(`${sourceName} copy`, TypedObject.values(variableSet.sets), payload.now);

	variableSet.sets = insertKeyAfter(variableSet.sets, payload.setId, newSetId, newName);

	for (const itemId of TypedObject.keys(variableSet.items)) {
		const sourceIdent = generateValueIdent(payload.setId, itemId);
		const sourceValue = variableSet.values[sourceIdent];
		if (sourceValue === undefined) continue;
		variableSet.values[generateValueIdent(newSetId, itemId)] = [...sourceValue];
	}
}

export function reduceMoveItem(state: VariableSetsState, { payload }: PayloadAction<MoveItemPayload>) {
	const variableSet = state.variableSets[payload.id];
	if (!variableSet || !(payload.itemId in variableSet.items)) return;
	variableSet.items = reorderRecord(variableSet.items, payload.itemId, payload.toIndex);
}

export function reduceMoveGroup(state: VariableSetsState, { payload }: PayloadAction<MoveGroupPayload>) {
	const variableSet = state.variableSets[payload.id];
	if (!variableSet || !(payload.setId in variableSet.sets)) return;
	variableSet.sets = reorderRecord(variableSet.sets, payload.setId, payload.toIndex);
}

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

export const variableSetsSlice = createSlice({
	name: 'variableSets',
	initialState: initialVariableSetsState,
	reducers: {},
	extraReducers: builder => {
		builder
			.addCase(actions.startVariableSets, reduceStartVariableSets)
			.addCase(actions.variableSetsOpened, reduceVariableSetsOpened)
			.addCase(actions.insertNewVariableSet, reduceInsertNewVariableSet)
			.addCase(actions.insertNewGroup, reduceInsertNewGroup)
			.addCase(actions.insertNewItem, reduceInsertNewItem)
			.addCase(actions.updateGroupName, reduceUpdateGroupName)
			.addCase(actions.updateItemName, reduceUpdateItemName)
			.addCase(actions.updateValue, reduceUpdateValue)
			.addCase(actions.removeVariableSetFromStore, reduceRemoveVariableSetFromStore)
			.addCase(actions.removeGroup, reduceRemoveGroup)
			.addCase(actions.removeItem, reduceRemoveItem)
			.addCase(actions.duplicateItem, reduceDuplicateItem)
			.addCase(actions.duplicateGroup, reduceDuplicateGroup)
			.addCase(actions.moveItem, reduceMoveItem)
			.addCase(actions.moveGroup, reduceMoveGroup);
	},
});

export default variableSetsSlice.reducer;

// ---------------------------------------------------------------------------
// Named selectors
// Accept a state shape that carries `global.variableSets` — same ambient
// contract as the flight-slice selectors. Works in @beak/state tests and
// inside @beak/ui's full ApplicationState.
// ---------------------------------------------------------------------------

type WithVariableSets = { global: { variableSets: VariableSetsState } };

/** Whether the variable-sets file has finished loading from disk. */
export const selectVariableSetsLoaded = (state: WithVariableSets) => state.global.variableSets.loaded;

/** The full variableSets dictionary keyed by variable-set id. */
export const selectVariableSetsMap = (state: WithVariableSets) => state.global.variableSets.variableSets;

/** A single VariableSet by id, or undefined when not found. */
export const selectVariableSetById = (id: string) => (state: WithVariableSets) =>
	state.global.variableSets.variableSets[id];

/** All variable-set ids (insertion-ordered). */
export const selectVariableSetIds = (state: WithVariableSets) =>
	Object.keys(state.global.variableSets.variableSets);

/** Total count of variable sets — used for the manage-grid badge. */
export const selectVariableSetCount = (state: WithVariableSets) =>
	Object.keys(state.global.variableSets.variableSets).length;
