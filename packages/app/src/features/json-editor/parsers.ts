import { TypedObject } from '@beak/common/helpers/typescript';
import { Entries, EntryMap, NamedEntries } from '@beak/common/types/beak-json-editor';
import { VariableGroups } from '@beak/common/types/beak-project';

import { parseValueParts } from '../variable-input/parser';

type JsonTypes = null | string | number | boolean | Record<string, unknown> | unknown[];

export function convertToRealJson(
	selectedGroups: Record<string, string>,
	variableGroups: VariableGroups,
	entries: EntryMap,
) {
	const root = TypedObject.values(entries).find(e => e.parentId === null);

	if (!root || !root.enabled)
		return null;

	return convertEntry(selectedGroups, variableGroups, entries, root);
}

export function convertToEntryJson(json: JsonTypes): EntryMap {
	return {};
}

function convertEntry(
	selectedGroups: Record<string, string>,
	variableGroups: VariableGroups,
	entries: EntryMap,
	entry: Entries,
): JsonTypes {
	switch (entry.type) {
		case 'null':
		case 'boolean':
			return entry.value;

		case 'number':
			return Number(parseValueParts(selectedGroups, variableGroups, entry.value));

		case 'string':
			return parseValueParts(selectedGroups, variableGroups, entry.value);

		case 'array': {
			const children = TypedObject
				.values(entries)
				.filter(e => e.parentId === entry.id && e.enabled);

			return children.map(c => convertEntry(selectedGroups, variableGroups, entries, c));
		}

		case 'object': {
			const children = TypedObject
				.values(entries)
				.filter(e => e.parentId === entry.id && e.enabled) as NamedEntries[];

			return children.reduce((acc, val) => ({
				...acc,
				[val.name]: convertEntry(selectedGroups, variableGroups, entries, val),
			}), {});
		}

		default:
			return null;
	}
}
