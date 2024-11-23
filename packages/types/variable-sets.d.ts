import { ValueSections } from './values';

export type VariableSets = Record<string, VariableSet>;

export interface VariableSet {
	sets: Record<string, string>;
	items: Record<string, string>;
	values: Record<string, ValueSections>;
}
