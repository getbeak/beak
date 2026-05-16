import type { VariableSet } from '@getbeak/types/variable-sets';
import { createReducer } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';

import {
	buildVariableSetsReducer,
	duplicateGroup,
	duplicateItem,
	generateValueIdent,
	initialVariableSetsState,
	insertNewVariableSet,
	moveGroup,
	moveItem,
	removeGroup,
	removeItem,
	removeVariableSetFromStore,
	startVariableSets,
	updateGroupName,
	updateItemName,
	updateValue,
	variableSetsOpened,
} from '..';

const reducer = createReducer(initialVariableSetsState, builder => {
	buildVariableSetsReducer(builder);
});

function makeGroup(): VariableSet {
	return {
		sets: { 'group-1': 'staging' },
		items: { 'item-1': 'apiKey' },
		values: {},
	};
}

const empty = reducer(undefined, { type: '@@INIT' });

describe('variable-groups reducer (core)', () => {
	it('starts unloaded with empty map', () => {
		expect(empty).toEqual({ loaded: false, variableSets: {} });
	});

	it('startVariableSets marks unloaded', () => {
		const next = reducer({ ...empty, loaded: true }, startVariableSets());
		expect(next.loaded).toBe(false);
	});

	it('variableSetsOpened populates and marks loaded', () => {
		const next = reducer(empty, variableSetsOpened({ variableSets: { vg1: makeGroup() } }));
		expect(next.loaded).toBe(true);
		expect(next.variableSets.vg1).toBeDefined();
	});

	it('insertNewVariableSet adds the group', () => {
		const next = reducer(empty, insertNewVariableSet({ id: 'vg1', variableSet: makeGroup() }));
		expect(next.variableSets.vg1.sets['group-1']).toBe('staging');
	});

	it('updateValue writes and clears values', () => {
		const seeded = reducer(empty, insertNewVariableSet({ id: 'vg1', variableSet: makeGroup() }));
		const ident = generateValueIdent('group-1', 'item-1');

		const written = reducer(
			seeded,
			updateValue({
				id: 'vg1',
				setId: 'group-1',
				itemId: 'item-1',
				updated: ['secret'],
			}),
		);
		expect(written.variableSets.vg1.values[ident]).toEqual(['secret']);

		const cleared = reducer(
			written,
			updateValue({
				id: 'vg1',
				setId: 'group-1',
				itemId: 'item-1',
				updated: [''],
			}),
		);
		expect(cleared.variableSets.vg1.values[ident]).toBeUndefined();
	});

	it('updateGroupName and updateItemName rename in-place', () => {
		const seeded = reducer(empty, insertNewVariableSet({ id: 'vg1', variableSet: makeGroup() }));
		const renamedGroup = reducer(
			seeded,
			updateGroupName({
				id: 'vg1',
				setId: 'group-1',
				updatedName: 'prod',
			}),
		);
		const renamedItem = reducer(
			renamedGroup,
			updateItemName({
				id: 'vg1',
				itemId: 'item-1',
				updatedName: 'apiToken',
			}),
		);
		expect(renamedItem.variableSets.vg1.sets['group-1']).toBe('prod');
		expect(renamedItem.variableSets.vg1.items['item-1']).toBe('apiToken');
	});

	it('removeGroup deletes the group and its values', () => {
		let state = reducer(empty, insertNewVariableSet({ id: 'vg1', variableSet: makeGroup() }));
		state = reducer(
			state,
			updateValue({
				id: 'vg1',
				setId: 'group-1',
				itemId: 'item-1',
				updated: ['x'],
			}),
		);
		const next = reducer(state, removeGroup({ id: 'vg1', setId: 'group-1' }));
		expect(next.variableSets.vg1.sets['group-1']).toBeUndefined();
		expect(next.variableSets.vg1.values).toEqual({});
	});

	it('removeItem deletes the item and its values', () => {
		let state = reducer(empty, insertNewVariableSet({ id: 'vg1', variableSet: makeGroup() }));
		state = reducer(
			state,
			updateValue({
				id: 'vg1',
				setId: 'group-1',
				itemId: 'item-1',
				updated: ['x'],
			}),
		);
		const next = reducer(state, removeItem({ id: 'vg1', itemId: 'item-1' }));
		expect(next.variableSets.vg1.items['item-1']).toBeUndefined();
		expect(next.variableSets.vg1.values).toEqual({});
	});

	it('removeVariableSetFromStore deletes the whole group', () => {
		const seeded = reducer(empty, insertNewVariableSet({ id: 'vg1', variableSet: makeGroup() }));
		const next = reducer(seeded, removeVariableSetFromStore('vg1'));
		expect(next.variableSets.vg1).toBeUndefined();
	});

	it('generateValueIdent produces the &-joined ident', () => {
		expect(generateValueIdent('a', 'b')).toBe('a&b');
	});

	it('duplicateItem clones values across every set with a unique name', () => {
		const base: VariableSet = {
			sets: { 'set-a': 'dev', 'set-b': 'prod' },
			items: { 'item-1': 'apiKey' },
			values: {
				[generateValueIdent('set-a', 'item-1')]: ['dev-secret'],
				[generateValueIdent('set-b', 'item-1')]: ['prod-secret'],
			},
		};
		const seeded = reducer(empty, insertNewVariableSet({ id: 'vg1', variableSet: base }));
		const dup = reducer(seeded, duplicateItem({ id: 'vg1', itemId: 'item-1' }));

		const itemEntries = Object.entries(dup.variableSets.vg1.items);
		expect(itemEntries).toHaveLength(2);
		const [, copyName] = itemEntries[1];
		expect(copyName).toBe('apiKey copy');
		const newItemId = itemEntries[1][0];
		expect(dup.variableSets.vg1.values[generateValueIdent('set-a', newItemId)]).toEqual(['dev-secret']);
		expect(dup.variableSets.vg1.values[generateValueIdent('set-b', newItemId)]).toEqual(['prod-secret']);
	});

	it('duplicateGroup clones values for every item and inserts after the source', () => {
		const base: VariableSet = {
			sets: { 'set-a': 'dev', 'set-b': 'prod' },
			items: { 'item-1': 'apiKey', 'item-2': 'baseUrl' },
			values: {
				[generateValueIdent('set-b', 'item-1')]: ['prod-secret'],
				[generateValueIdent('set-b', 'item-2')]: ['https://api'],
			},
		};
		const seeded = reducer(empty, insertNewVariableSet({ id: 'vg1', variableSet: base }));
		const dup = reducer(seeded, duplicateGroup({ id: 'vg1', setId: 'set-b' }));

		const setEntries = Object.entries(dup.variableSets.vg1.sets);
		expect(setEntries.map(([, v]) => v)).toEqual(['dev', 'prod', 'prod copy']);
		const newSetId = setEntries[2][0];
		expect(dup.variableSets.vg1.values[generateValueIdent(newSetId, 'item-1')]).toEqual(['prod-secret']);
		expect(dup.variableSets.vg1.values[generateValueIdent(newSetId, 'item-2')]).toEqual(['https://api']);
	});

	it('moveItem reorders items in the underlying record', () => {
		const base: VariableSet = {
			sets: { 'set-a': 'dev' },
			items: { 'item-1': 'a', 'item-2': 'b', 'item-3': 'c' },
			values: {},
		};
		const seeded = reducer(empty, insertNewVariableSet({ id: 'vg1', variableSet: base }));
		const next = reducer(seeded, moveItem({ id: 'vg1', itemId: 'item-3', toIndex: 0 }));
		expect(Object.keys(next.variableSets.vg1.items)).toEqual(['item-3', 'item-1', 'item-2']);
	});

	it('moveGroup reorders sets in the underlying record', () => {
		const base: VariableSet = {
			sets: { 'set-a': 'dev', 'set-b': 'staging', 'set-c': 'prod' },
			items: {},
			values: {},
		};
		const seeded = reducer(empty, insertNewVariableSet({ id: 'vg1', variableSet: base }));
		const next = reducer(seeded, moveGroup({ id: 'vg1', setId: 'set-a', toIndex: 2 }));
		expect(Object.keys(next.variableSets.vg1.sets)).toEqual(['set-b', 'set-c', 'set-a']);
	});
});
