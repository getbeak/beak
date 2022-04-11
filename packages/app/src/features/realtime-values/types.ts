import { RealtimeValuePart, VariableGroups } from '@beak/common/types/beak-project';

export interface RealtimeValue<
	T extends RealtimeValuePart,
	TS extends void | any = void,
> {
	type: string;

	name: string;
	description: string;
	sensitive: boolean;

	initValuePart: (ctx: Context) => Promise<T>;
	createValuePart: (ctx: Context, payload: T['payload']) => T;

	getValue: (ctx: Context, payload: T['payload']) => Promise<string>;

	editor?: {
		ui: UISection<TS>[];

		load: (ctx: Context, payload: T['payload']) => Promise<TS>;
		save: (ctx: Context, payload: T['payload'], state: TS) => Promise<T['payload']>;
	};
}

export type UISection<T> = TextInput<T> | NumberInput<T> | CheckboxInput<T> | OptionsInput<T>;

export interface Context {
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
