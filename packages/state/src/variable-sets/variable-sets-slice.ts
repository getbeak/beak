import { TypedObject } from '@beak/common/helpers/typescript';
import ksuid from '@beak/ksuid';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import * as actions from './actions';
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
// Private helpers
// ---------------------------------------------------------------------------

/**
 * JS preserves insertion order for non-numeric string keys. To reorder a
 * Record we rebuild it with the keys in the new order. ksuid keys are
 * non-numeric so this is safe.
 *
 * TODO ADR 0005 §4 — inline business logic (reorder); extract to a
 * dedicated utility once the §4 sweep lands.
 */
function reorderRecord<T>(record: Record<string, T>, key: string, toIndex: number): Record<string, T> {
	const keys = Object.keys(record);
	const from = keys.indexOf(key);
	if (from === -1) return record;
	const clamped = Math.max(0, Math.min(toIndex, keys.length - 1));
	if (from === clamped) return record;
	keys.splice(from, 1);
	keys.splice(clamped, 0, key);
	const next: Record<string, T> = {};
	for (const k of keys) next[k] = record[k];
	return next;
}

/**
 * TODO ADR 0005 §4 — inline business logic (insertKeyAfter / duplicate);
 * extract to a dedicated utility once the §4 sweep lands.
 */
function insertKeyAfter<T>(record: Record<string, T>, afterKey: string, newKey: string, value: T): Record<string, T> {
	const keys = Object.keys(record);
	const at = keys.indexOf(afterKey);
	const next: Record<string, T> = {};
	if (at === -1) {
		for (const k of keys) next[k] = record[k];
		next[newKey] = value;
		return next;
	}
	for (let i = 0; i < keys.length; i++) {
		next[keys[i]] = record[keys[i]];
		if (i === at) next[newKey] = value;
	}
	return next;
}

/**
 * TODO ADR 0005 §4 — inline business logic (uniqueName); extract to a
 * dedicated utility once the §4 sweep lands.
 */
function uniqueName(base: string, taken: string[]): string {
	if (!taken.includes(base)) return base;
	for (let i = 2; i < 1000; i++) {
		const candidate = `${base} ${i}`;
		if (!taken.includes(candidate)) return candidate;
	}
	return `${base} ${Date.now()}`; // TODO ADR 0005 §2 — side-effectful Date.now() in reducer
}

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
	// TODO ADR 0005 §2 — ksuid.generate() call inside reducer; mint IDs in the action creator / effect instead
	variableSet.sets[ksuid.generate('set').toString()] = payload.setName;
}

export function reduceInsertNewItem(state: VariableSetsState, { payload }: PayloadAction<InsertNewItemPayload>) {
	const variableSet = state.variableSets[payload.id];
	if (!variableSet) return;
	// TODO ADR 0005 §2 — ksuid.generate() call inside reducer; mint IDs in the action creator / effect instead
	variableSet.items[ksuid.generate('item').toString()] = payload.itemName;
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
	// TODO ADR 0005 §2 — ksuid.generate() call inside reducer; mint IDs in the action creator / effect instead
	const newItemId = ksuid.generate('item').toString();
	// TODO ADR 0005 §4 — inline uniqueName business logic; extract once the §4 sweep lands
	const newName = uniqueName(`${sourceName} copy`, TypedObject.values(variableSet.items));

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
	// TODO ADR 0005 §2 — ksuid.generate() call inside reducer; mint IDs in the action creator / effect instead
	const newSetId = ksuid.generate('set').toString();
	// TODO ADR 0005 §4 — inline uniqueName business logic; extract once the §4 sweep lands
	const newName = uniqueName(`${sourceName} copy`, TypedObject.values(variableSet.sets));

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
	// TODO ADR 0005 §4 — inline reorderRecord business logic; extract once the §4 sweep lands
	variableSet.items = reorderRecord(variableSet.items, payload.itemId, payload.toIndex);
}

export function reduceMoveGroup(state: VariableSetsState, { payload }: PayloadAction<MoveGroupPayload>) {
	const variableSet = state.variableSets[payload.id];
	if (!variableSet || !(payload.setId in variableSet.sets)) return;
	// TODO ADR 0005 §4 — inline reorderRecord business logic; extract once the §4 sweep lands
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
