import { ValueSections } from './values';

export type EntryMap = Record<string, Entries>;
export type EntryType = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array' | 'enum';

export interface Base {
	id: string;
	parentId: string | null;
	enabled: boolean;
	/** Schema metadata — set in schema mode, ignored at flight time. */
	required?: boolean;
	description?: string;
}

export interface NamedEntryBase {
	name: string;
}

export interface StringEntry extends Base {
	type: 'string';
	value: ValueSections;
}

export interface NumberEntry extends Base {
	type: 'number';
	value: ValueSections;
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
}
export interface ArrayEntry extends Base {
	type: 'array';
}

/**
 * Enum-typed JSON entry — same on-wire shape as a string (the value is a
 * single literal from a closed set), but the editor renders a dropdown
 * picker in value mode and an options-list editor in schema mode. `options`
 * is the schema constraint; missing or empty means the editor falls back to
 * free text.
 */
export interface EnumEntry extends Base {
	type: 'enum';
	value: ValueSections;
	options?: string[];
}

export interface NamedStringEntry extends StringEntry, NamedEntryBase {}
export interface NamedNumberEntry extends NumberEntry, NamedEntryBase {}
export interface NamedBooleanEntry extends BooleanEntry, NamedEntryBase {}
export interface NamedNullEntry extends NullEntry, NamedEntryBase {}
export interface NamedObjectEntry extends ObjectEntry, NamedEntryBase {}
export interface NamedArrayEntry extends ArrayEntry, NamedEntryBase {}
export interface NamedEnumEntry extends EnumEntry, NamedEntryBase {}

export type Entries = NamedEntries | AnonymousEntries;
export type AnonymousEntries =
	| StringEntry
	| NumberEntry
	| BooleanEntry
	| NullEntry
	| ObjectEntry
	| ArrayEntry
	| EnumEntry;
export type ValueEntries = StringEntry | NumberEntry | BooleanEntry | NullEntry | EnumEntry;

export type NamedEntries =
	| NamedStringEntry
	| NamedNumberEntry
	| NamedBooleanEntry
	| NamedNullEntry
	| NamedObjectEntry
	| NamedArrayEntry
	| NamedEnumEntry;
