import { TypedObject } from '@beak/common/helpers/typescript';
import { Entries, EntryMap, NamedEntries, StringEntry } from '@beak/common/types/beak-json-editor';
import ksuid from '@cuvva/ksuid';

import { parseValueParts } from '../realtime-values/parser';
import { Context } from '../realtime-values/types';

type JsonTypes = null | string | number | boolean | Record<string, unknown> | unknown[];

export async function convertToRealJson(context: Context, entries: EntryMap) {
	const root = TypedObject.values(entries).find(e => e.parentId === null);

	if (!root || !root.enabled)
		return null;

	return await convertEntry(context, entries, root);
}

async function convertEntry(
	context: Context,
	entries: EntryMap,
	entry: Entries,
): Promise<JsonTypes> {
	switch (entry.type) {
		case 'null':
		case 'boolean':
			return entry.value;

		case 'number':
			return Number(await parseValueParts(context, entry.value));

		case 'string':
			return await parseValueParts(context, entry.value);

		case 'array': {
			const children = TypedObject
				.values(entries)
				.filter(e => e.parentId === entry.id && e.enabled);

			return await Promise.all(children.map(c => convertEntry(context, entries, c)));
		}

		case 'object': {
			const children = TypedObject
				.values(entries)
				.filter(e => e.parentId === entry.id && e.enabled) as NamedEntries[];

			const out: Record<string, unknown> = {};

			await Promise.all(children.map(async c => {
				out[c.name] = await convertEntry(context, entries, c);
			}));

			return out;
		}

		default:
			return null;
	}
}

export function convertToEntryJson(json: JsonTypes, parentId: string | null = null, name?: string): EntryMap {
	const out: EntryMap = {};
	const id = ksuid.generate('jsonentry').toString() as string;

	switch (true) {
		case typeof json === 'number':
			out[id] = {
				id,
				name,
				enabled: true,
				parentId,
				type: typeof json,
				value: [json!.toString(10)],
			} as Entries;
			break;

		case typeof json === 'string':
			out[id] = {
				id,
				name,
				enabled: true,
				parentId,
				type: typeof json,
				value: [json],
			} as Entries;
			break;

		case typeof json === 'boolean':
			out[id] = {
				id,
				name,
				enabled: true,
				parentId,
				type: 'boolean',
				value: json,
			} as Entries;
			break;

		case json === null:
			out[id] = {
				id,
				name,
				enabled: true,
				parentId,
				type: 'null',
				value: null,
			} as Entries;
			break;

		case Array.isArray(json): {
			out[id] = {
				id,
				name,
				enabled: true,
				parentId,
				type: 'array',
			} as Entries;

			(json as JsonTypes[])
				.map(e => convertToEntryJson(e, id))
				.map(e => TypedObject.keys(e).forEach(k => {
					out[k] = e[k];
				}));

			break;
		}

		case typeof json === 'object': {
			out[id] = {
				id,
				name,
				enabled: true,
				parentId,
				type: 'object',
			} as Entries;

			TypedObject
				.keys(json as Record<string, JsonTypes>)
				.map(key => convertToEntryJson((json as Record<string, JsonTypes>)[key], id, key))
				.map(e => TypedObject.keys(e).forEach(k => {
					out[k] = e[k];
				}));

			break;
		}

		default:
			break;
	}

	// Handle edge case where the root string value is '""'
	const keys = Object.keys(out);

	if (keys.length === 1 && out[keys[0]].type === 'string') {
		const entry = (out[keys[0]] as StringEntry);

		if (entry.value[0] === '""')
			entry.value[0] = '';
	}

	return out;
}
