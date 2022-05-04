import type { Context } from '@getbeak/types/values';

import { RealtimeValuePart } from './values';

export interface RealtimeValue<
	T extends RealtimeValuePart,
	TS extends void | any = void,
> {
	type: string;

	name: string;
	description: string;
	sensitive: boolean;

	initValuePart: (ctx: Context) => Promise<T>;

	/**
	 * Get's a unique key representing this real-time value
	 */
	getRecursiveKey?: (ctx: Context, payload: T['payload']) => string;
	getValue: (ctx: Context, payload: T['payload'], recursiveSet?: Set<string>) => Promise<string>;

	attributes: Attributes;

	editor?: {
		createUi: (ctx: Context) => UISection<TS>[];

		load: (ctx: Context, payload: T['payload']) => Promise<TS>;
		save: (ctx: Context, payload: T['payload'], state: TS) => Promise<T['payload']>;
	};
}

/* eslint-disable @typescript-eslint/indent */
export type UISection<T> = ValuePartInput<T> |
	TextInput<T> |
	NumberInput<T> |
	CheckboxInput<T> |
	OptionsInput<T> |
	RequestSelectInput<T>;
/* eslint-enable @typescript-eslint/indent */

export interface Attributes {
	requiresRequestId?: boolean;
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

interface RequestSelectInput<T> {
	type: 'request_select_input';
	stateBinding: keyof T;
	label?: string;
}
