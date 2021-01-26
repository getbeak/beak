import { ValueParts } from './beak-project';

export interface Base {
	enabled: boolean;
}

export interface NamedEntry {
	name: ValueParts[];
}

export interface StringEntry extends Base {
	type: 'string';
	value: ValueParts[];
}

export interface NumberEntry extends Base {
	type: 'number';
	value: ValueParts[];
}

export interface BooleanEntry extends Base {
	type: 'boolean';
	value: boolean;
}

export interface NullEntry extends Base {
	type: 'null';
	value: null;
}

export interface ObjectEntry extends Base {
	type: 'object';
	value: NamedEntries[];
}

export interface ArrayEntry extends Base {
	type: 'array';
	value: Entries[];
}

export type Entries = StringEntry | NumberEntry | BooleanEntry | NullEntry | ObjectEntry | ArrayEntry;

/* eslint-disable @typescript-eslint/indent */
export type NamedEntries = NamedStringEntry |
	NamedNumberEntry |
	NamedBooleanEntry |
	NamedNullEntry |
	NamedObjectEntry |
	NamedArrayEntry;
/* eslint-enable @typescript-eslint/indent */

export interface NamedStringEntry extends StringEntry, NamedEntry { }
export interface NamedNumberEntry extends NumberEntry, NamedEntry { }
export interface NamedBooleanEntry extends BooleanEntry, NamedEntry { }
export interface NamedNullEntry extends NullEntry, NamedEntry { }
export interface NamedObjectEntry extends ObjectEntry, NamedEntry { }
export interface NamedArrayEntry extends ArrayEntry, NamedEntry { }
