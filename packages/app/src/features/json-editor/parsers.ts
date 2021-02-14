import { TypedObject } from '@beak/common/helpers/typescript';
import { Entries, EntryMap, NamedEntries } from '@beak/common/types/beak-json-editor';

export function convertToRealJson(entries: EntryMap) {
	const root = TypedObject.values(entries).find(e => e.parentId === null);

	if (!root)
		return null;

	return convertEntry(entries, root);
}

type Test = Record<string, unknown> | null | string | number | boolean | unknown[];

function convertEntry(entries: EntryMap, entry: Entries): Test {
	console.log(entry);

	switch (entry.type) {
		case 'null':
		case 'boolean':
			return entry.value;

		case 'number':
		case 'string': {
			// const parts = entry.value;

			return 'parts';
		}

		case 'array': {
			const children = TypedObject.values(entries).filter(e => e.parentId === entry.id);

			return children.map(c => convertEntry(entries, c));
		}

		case 'object': {
			const children = TypedObject.values(entries).filter(e => e.parentId === entry.id) as NamedEntries[];

			return children.reduce((acc, val) => ({
				...acc,
				[val.name]: convertEntry(entries, val),
			}), {});
		}

		default:
			return null;
	}
}
