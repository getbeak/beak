import { FlightHistory } from '@beak/app/store/flight/types';
import { Tree, ValueParts, VariableGroups } from '@beak/common/types/beak-project';
import { RealtimeValuePart } from '@beak/common/types/realtime-values';

export interface RealtimeValue<
	T extends RealtimeValuePart,
	TS extends void | any = void,
> {
	type: string;

	name: string;
	description: string;
	sensitive: boolean;

	initValuePart: (ctx: Context) => Promise<T>;

	getRecursiveKey?: (ctx: Context, payload: T['payload']) => string;
	getValue: (ctx: Context, payload: T['payload'], recursiveSet?: Set<string>) => Promise<string | ValueParts>;

	attributes: Attributes;

	editor?: {
		ui: UISection<TS>[];

		load: (ctx: Context, payload: T['payload']) => Promise<TS>;
		save: (ctx: Context, payload: T['payload'], state: TS) => Promise<T['payload']>;
	};
}

export type UISection<T> = ValuePartInput<T> | TextInput<T> | NumberInput<T> | CheckboxInput<T> | OptionsInput<T>;

export interface Attributes {
	requiresRequestId?: boolean;
}

export interface Context {
	selectedGroups: Record<string, string>;
	variableGroups: VariableGroups;
	projectTree: Tree;
	flightHistory: Record<string, FlightHistory>;
	currentRequestId?: string;
}

interface ValuePartInput<T> {
	type: 'value_parts_input';
	stateBinding: keyof T;
	label?: string;
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
