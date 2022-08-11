/* eslint-disable max-len */
import type { Context } from '@getbeak/types/values';

export interface RealtimeValueBase { }

interface RealtimeValueGetter<TPayload> {

	/**
	 * Gets the string value of the value, given the payload body
	 * @param {Context} ctx The project context.
	 * @param {TPayload} payload This instance of the value's payload data.
	 */
	getValue: (ctx: Context, payload: TPayload) => Promise<string>;
}

interface GenericDictionary {
	[k: string]: any;
}

export interface RealtimeValueInformation extends RealtimeValueBase {

	/**
	 * The public facing name of your extension.
	 */
	name: string;

	/**
	 * The public facing description of your extension.
	 */
	description: string;

	/**
	 * Denotes if the value's output is sensitive, and will be hidden by default in the UI and in copied responses.
	 */
	sensitive: boolean;

	/**
	 * Attributes that define when and how this value should be shown.
	 */
	attributes: Attributes;
}

export interface RealtimeValue<TPayload extends GenericDictionary> extends RealtimeValueGetter<TPayload>, RealtimeValueInformation {

	/**
	 * Creates a default payload, if the user doesn't specify any data.
	 * @param {Context} ctx The project context.
	 */
	createDefaultPayload: (ctx: Context) => Promise<TPayload>;
}

export interface EditableRealtimeValue<TPayload extends GenericDictionary, TEditorState extends GenericDictionary = TPayload> extends RealtimeValue<TPayload> {

	/**
	 * Details how Beak and user's should interact with the value editor for your realtime value.
	 */
	editor: Editor<TPayload, TEditorState>;
}

interface Attributes {

	/**
	 * Denotes if the value will only appear in the variable selector if it has the context of a request.
	 */
	requiresRequestId?: boolean;
}

interface Editor<TPayload extends GenericDictionary, TEditorState extends GenericDictionary> {

	/**
	 * Generates the editor user interface
	 * @param {Context} ctx The project context.
	 */
	createUserInterface: (ctx: Context) => Promise<UISection<TEditorState>[]>;

	/**
	 * If the payload data isn't the same as the editor state, this will convert Payload -> State
	 * @param {Context} ctx The project context.
	 * @param {TPayload} payload This instance of the value's payload data.
	 */
	load: (ctx: Context, payload: TPayload) => Promise<TEditorState>;

	/**
	 * If the payload data isn't the same as the editor state, this will convert State -> Payload
	 * @param {Context} ctx The project context.
	 * @param {TPayload} existingPayload This existing instance of the value's payload data.
	 * @param {TEditorState} state This instance of the updated state data.
	 */
	save: (ctx: Context, existingPayload: TPayload, state: TEditorState) => Promise<TPayload>;
}

/* eslint-disable @typescript-eslint/indent */
export type UISection<T extends GenericDictionary = Record<string, never>> =
	ValuePartInput<T> |
	TextInput<T> |
	NumberInput<T> |
	CheckboxInput<T> |
	OptionsInput<T> |
	RequestSelectInput<T>;
/* eslint-enable @typescript-eslint/indent */

interface ValuePartInput<T extends GenericDictionary> {
	type: 'value_parts_input';
	stateBinding: keyof T;
	label?: string;
}

interface TextInput<T extends GenericDictionary> {
	type: 'string_input';
	stateBinding: keyof T;
	label?: string;
}

interface NumberInput<T extends GenericDictionary> {
	type: 'number_input';
	stateBinding: keyof T;
	label?: string;
}

interface CheckboxInput<T extends GenericDictionary> {
	type: 'checkbox_input';
	stateBinding: keyof T;
	label?: string;
}

interface OptionsInput<T extends GenericDictionary> {
	type: 'options_input';
	stateBinding: keyof T;
	label?: string;
	options: { key: string; label: string }[];
}

interface RequestSelectInput<T extends GenericDictionary> {
	type: 'request_select_input';
	stateBinding: keyof T;
	label?: string;
}

declare global {
	const beakApi: Beak;
}

type Level = 'info' | 'warn' | 'error';

interface Beak {
	parseValueParts: (ctx: Context, parts: unknown[]) => Promise<string>;

	log: (level: Level, message: string) => void;
}
