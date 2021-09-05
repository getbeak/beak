import { RealtimeValuePart, VariableGroups } from '@beak/common/types/beak-project';

export interface RealtimeValue<
	T extends Record<string, unknown> | void = void,
	TS extends void | any = void
> {
	type: string;

	name: string;
	description: string;

	initValuePart: (ctx: Context) => Promise<RealtimeValuePart>;
	createValuePart: (ctx: Context, item: T) => RealtimeValuePart;

	getValue: (ctx: Context, item: T) => Promise<string>;

	editor?: {
		ui: UISection<TS>[];

		load: (ctx: Context, item: T) => Promise<TS>;
		save: (ctx: Context, item: T, state: TS) => Promise<T>;
	};
}

export type UISection<T> = TextInput<T> | NumberInput<T> | CheckboxInput<T> | OptionsInput<T>;

export interface Context {
	projectPath: string;
	selectedGroups: Record<string, string>;
	variableGroups: VariableGroups;
}

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
