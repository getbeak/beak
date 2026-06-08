import { TypedObject } from '@beak/common/helpers/typescript';
import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';

import * as actions from './actions';
import { generateValueIdent, type VariableSetsState } from './types';

/**
 * Attaches the pure variable-sets reducer cases to the given builder. The
 * builder's state type only needs to be a subtype of VariableSetsState — UI
 * packages compose this into a wider state shape (rename, file-watch, etc.).
 *
 * Every mutating case guards the target set first: a stale rename/remove can
 * easily arrive after `removeVariableSetFromStore` has fired (file-watch
 * deletion, undo replay), and crashing the store on a no-op is worse than
 * dropping the action.
 */
export function buildVariableSetsReducer<S extends VariableSetsState>(builder: ActionReducerMapBuilder<S>) {
	builder
		.addCase(actions.startVariableSets, state => {
			state.loaded = false;
		})
		.addCase(actions.variableSetsOpened, (state, { payload }) => {
			state.variableSets = payload.variableSets;
			state.loaded = true;
		})

		.addCase(actions.insertNewVariableSet, (state, { payload }) => {
			state.variableSets[payload.id] = payload.variableSet;
		})
		.addCase(actions.insertNewGroup, (state, { payload }) => {
			const variableSet = state.variableSets[payload.id];
			if (!variableSet) return;
			variableSet.sets[payload.setId] = payload.setName;
		})
		.addCase(actions.insertNewItem, (state, { payload }) => {
			const variableSet = state.variableSets[payload.id];
			if (!variableSet) return;
			variableSet.items[payload.itemId] = payload.itemName;
		})

		.addCase(actions.updateGroupName, (state, { payload }) => {
			const variableSet = state.variableSets[payload.id];
			if (!variableSet || !(payload.setId in variableSet.sets)) return;
			variableSet.sets[payload.setId] = payload.updatedName;
		})
		.addCase(actions.updateItemName, (state, { payload }) => {
			const variableSet = state.variableSets[payload.id];
			if (!variableSet || !(payload.itemId in variableSet.items)) return;
			variableSet.items[payload.itemId] = payload.updatedName;
		})
		.addCase(actions.updateValue, (state, { payload }) => {
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
		})

		.addCase(actions.removeVariableSetFromStore, (state, { payload }) => {
			delete state.variableSets[payload];
		})

		.addCase(actions.removeGroup, (state, { payload }) => {
			const variableSet = state.variableSets[payload.id];
			if (!variableSet) return;

			delete variableSet.sets[payload.setId];

			TypedObject.keys(variableSet.values)
				.filter(k => k.startsWith(`${payload.setId}&`))
				.forEach(k => {
					delete variableSet.values[k];
				});
		})
		.addCase(actions.removeItem, (state, { payload }) => {
			const variableSet = state.variableSets[payload.id];
			if (!variableSet) return;

			delete variableSet.items[payload.itemId];

			TypedObject.keys(variableSet.values)
				.filter(k => k.endsWith(`&${payload.itemId}`))
				.forEach(k => {
					delete variableSet.values[k];
				});
		})

		.addCase(actions.duplicateItem, (state, { payload }) => {
			const variableSet = state.variableSets[payload.id];
			if (!variableSet || !(payload.itemId in variableSet.items)) return;

			const sourceName = variableSet.items[payload.itemId];
			const newName = uniqueName(`${sourceName} copy`, TypedObject.values(variableSet.items), payload.now);

			variableSet.items = insertKeyAfter(variableSet.items, payload.itemId, payload.newItemId, newName);

			for (const setId of TypedObject.keys(variableSet.sets)) {
				const sourceIdent = generateValueIdent(setId, payload.itemId);
				const sourceValue = variableSet.values[sourceIdent];
				if (sourceValue === undefined) continue;
				variableSet.values[generateValueIdent(setId, payload.newItemId)] = [...sourceValue];
			}
		})
		.addCase(actions.duplicateGroup, (state, { payload }) => {
			const variableSet = state.variableSets[payload.id];
			if (!variableSet || !(payload.setId in variableSet.sets)) return;

			const sourceName = variableSet.sets[payload.setId];
			const newName = uniqueName(`${sourceName} copy`, TypedObject.values(variableSet.sets), payload.now);

			variableSet.sets = insertKeyAfter(variableSet.sets, payload.setId, payload.newSetId, newName);

			for (const itemId of TypedObject.keys(variableSet.items)) {
				const sourceIdent = generateValueIdent(payload.setId, itemId);
				const sourceValue = variableSet.values[sourceIdent];
				if (sourceValue === undefined) continue;
				variableSet.values[generateValueIdent(payload.newSetId, itemId)] = [...sourceValue];
			}
		})

		.addCase(actions.moveItem, (state, { payload }) => {
			const variableSet = state.variableSets[payload.id];
			if (!variableSet || !(payload.itemId in variableSet.items)) return;
			variableSet.items = reorderRecord(variableSet.items, payload.itemId, payload.toIndex);
		})
		.addCase(actions.moveGroup, (state, { payload }) => {
			const variableSet = state.variableSets[payload.id];
			if (!variableSet || !(payload.setId in variableSet.sets)) return;
			variableSet.sets = reorderRecord(variableSet.sets, payload.setId, payload.toIndex);
		});
}

/**
 * JS preserves insertion order for non-numeric string keys. To reorder a
 * Record we rebuild it with the keys in the new order. ksuid keys are
 * non-numeric so this is safe.
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

function uniqueName(base: string, taken: string[], now: number): string {
	if (!taken.includes(base)) return base;
	for (let i = 2; i < 1000; i++) {
		const candidate = `${base} ${i}`;
		if (!taken.includes(candidate)) return candidate;
	}
	return `${base} ${now}`;
}
