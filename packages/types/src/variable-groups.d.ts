import { ValueParts } from './values';

export type VariableGroups = Record<string, VariableGroup>;

export interface VariableGroup {
	groups: Record<string, string>;
	items: Record<string, string>;
	values: Record<string, ValueParts>;
}
