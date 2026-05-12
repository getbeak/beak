import type { VariableSet } from '@getbeak/types/variable-sets';
import { createReducer } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';

import {
	buildVariableSetsReducer,
	generateValueIdent,
	initialVariableSetsState,
	insertNewVariableSet,
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
});
