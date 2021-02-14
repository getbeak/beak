import { ValueParts } from './beak-project';

export type EntryMap = Record<string, Entries>;
export type EntryType = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';

export interface Base {
	id: string;
	parentId: string | null;
	enabled: boolean;
}

export interface NamedEntryBase { name: string }

export interface StringEntry extends Base {
	type: 'string';
	value: ValueParts;
}

export interface NumberEntry extends Base {
	type: 'number';
	value: ValueParts;
}

export interface BooleanEntry extends Base {
	type: 'boolean';
	value: boolean;
}

export interface NullEntry extends Base {
	type: 'null';
	value: null;
}

export interface ObjectEntry extends Base { type: 'object' }
export interface ArrayEntry extends Base { type: 'array' }

export interface NamedStringEntry extends StringEntry, NamedEntryBase { }
export interface NamedNumberEntry extends NumberEntry, NamedEntryBase { }
export interface NamedBooleanEntry extends BooleanEntry, NamedEntryBase { }
export interface NamedNullEntry extends NullEntry, NamedEntryBase { }
export interface NamedObjectEntry extends ObjectEntry, NamedEntryBase { }
export interface NamedArrayEntry extends ArrayEntry, NamedEntryBase { }

export type Entries = NamedEntries | AnonymousEntries;
export type AnonymousEntries = StringEntry | NumberEntry | BooleanEntry | NullEntry | ObjectEntry | ArrayEntry;

/* eslint-disable @typescript-eslint/indent */
export type NamedEntries = NamedStringEntry |
	NamedNumberEntry |
	NamedBooleanEntry |
	NamedNullEntry |
	NamedObjectEntry |
	NamedArrayEntry;
/* eslint-enable @typescript-eslint/indent */
