import type { VariableGroup } from '@getbeak/types/variable-groups';
import { createReducer } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';

import {
	buildVariableGroupsReducer,
	generateValueIdent,
	initialVariableGroupsState,
	insertNewVariableGroup,
	removeGroup,
	removeItem,
	removeVariableGroupFromStore,
	startVariableGroups,
	updateGroupName,
	updateItemName,
	updateValue,
	variableGroupsOpened,
} from '..';

const reducer = createReducer(initialVariableGroupsState, builder => {
	buildVariableGroupsReducer(builder);
});

function makeGroup(): VariableGroup {
	return {
		groups: { 'group-1': 'staging' },
		items: { 'item-1': 'apiKey' },
		values: {},
	};
}

const empty = reducer(undefined, { type: '@@INIT' });

describe('variable-groups reducer (core)', () => {
	it('starts unloaded with empty map', () => {
		expect(empty).toEqual({ loaded: false, variableGroups: {} });
	});

	it('startVariableGroups marks unloaded', () => {
		const next = reducer({ ...empty, loaded: true }, startVariableGroups());
		expect(next.loaded).toBe(false);
	});

	it('variableGroupsOpened populates and marks loaded', () => {
		const next = reducer(empty, variableGroupsOpened({ variableGroups: { vg1: makeGroup() } }));
		expect(next.loaded).toBe(true);
		expect(next.variableGroups.vg1).toBeDefined();
	});

	it('insertNewVariableGroup adds the group', () => {
		const next = reducer(empty, insertNewVariableGroup({ id: 'vg1', variableGroup: makeGroup() }));
		expect(next.variableGroups.vg1.groups['group-1']).toBe('staging');
	});

	it('updateValue writes and clears values', () => {
		const seeded = reducer(empty, insertNewVariableGroup({ id: 'vg1', variableGroup: makeGroup() }));
		const ident = generateValueIdent('group-1', 'item-1');

		const written = reducer(
			seeded,
			updateValue({
				id: 'vg1',
				groupId: 'group-1',
				itemId: 'item-1',
				updated: ['secret'],
			}),
		);
		expect(written.variableGroups.vg1.values[ident]).toEqual(['secret']);

		const cleared = reducer(
			written,
			updateValue({
				id: 'vg1',
				groupId: 'group-1',
				itemId: 'item-1',
				updated: [''],
			}),
		);
		expect(cleared.variableGroups.vg1.values[ident]).toBeUndefined();
	});

	it('updateGroupName and updateItemName rename in-place', () => {
		const seeded = reducer(empty, insertNewVariableGroup({ id: 'vg1', variableGroup: makeGroup() }));
		const renamedGroup = reducer(
			seeded,
			updateGroupName({
				id: 'vg1',
				groupId: 'group-1',
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
		expect(renamedItem.variableGroups.vg1.groups['group-1']).toBe('prod');
		expect(renamedItem.variableGroups.vg1.items['item-1']).toBe('apiToken');
	});

	it('removeGroup deletes the group and its values', () => {
		let state = reducer(empty, insertNewVariableGroup({ id: 'vg1', variableGroup: makeGroup() }));
		state = reducer(
			state,
			updateValue({
				id: 'vg1',
				groupId: 'group-1',
				itemId: 'item-1',
				updated: ['x'],
			}),
		);
		const next = reducer(state, removeGroup({ id: 'vg1', groupId: 'group-1' }));
		expect(next.variableGroups.vg1.groups['group-1']).toBeUndefined();
		expect(next.variableGroups.vg1.values).toEqual({});
	});

	it('removeItem deletes the item and its values', () => {
		let state = reducer(empty, insertNewVariableGroup({ id: 'vg1', variableGroup: makeGroup() }));
		state = reducer(
			state,
			updateValue({
				id: 'vg1',
				groupId: 'group-1',
				itemId: 'item-1',
				updated: ['x'],
			}),
		);
		const next = reducer(state, removeItem({ id: 'vg1', itemId: 'item-1' }));
		expect(next.variableGroups.vg1.items['item-1']).toBeUndefined();
		expect(next.variableGroups.vg1.values).toEqual({});
	});

	it('removeVariableGroupFromStore deletes the whole group', () => {
		const seeded = reducer(empty, insertNewVariableGroup({ id: 'vg1', variableGroup: makeGroup() }));
		const next = reducer(seeded, removeVariableGroupFromStore('vg1'));
		expect(next.variableGroups.vg1).toBeUndefined();
	});

	it('generateValueIdent produces the &-joined ident', () => {
		expect(generateValueIdent('a', 'b')).toBe('a&b');
	});
});
