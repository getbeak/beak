import { RealtimeValuePart, VariableGroups } from '@beak/common/types/beak-project';

export interface RealtimeValue<
	T extends Record<string, unknown> | void = void,
	TS extends void | any = void
> {
	type: string;

	name: string;
	description: string;

	initValuePart: (variableGroups: VariableGroups) => Promise<RealtimeValuePart>;
	createValuePart: (item: T, variableGroups: VariableGroups) => RealtimeValuePart;

	getValue: (item: T, variableGroups: VariableGroups, selectedGroups: Record<string, string>) => Promise<string>;

	editor?: {
		ui: UISection<TS>[];

		load: (item: T) => Promise<TS>;
		save: (item: T, state: TS) => Promise<T>;
	};
}

export type UISection<T> = TextInput<T> | NumberInput<T> | CheckboxInput<T> | OptionsInput<T>;

interface TextInput<T> {
	type: 'string_input';
	stateBinding: keyof T;
	label?: string;
}

interface NumberInput<T> {
	type: 'number_input';
	stateBinding: keyof T;
	label?: string;
}

interface CheckboxInput<T> {
	type: 'checkbox_input';
	stateBinding: keyof T;
	label?: string;
}

interface OptionsInput<T> {
	type: 'options_input';
	stateBinding: keyof T;
	label?: string;
	options: { key: string; label: string }[];
}
