/* eslint-disable max-len */
import type { Context } from '@getbeak/types/values';

export interface VariableBase { }

interface VariableGetter<TPayload> {

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

export interface VariableStaticInformation extends VariableBase {

	/**
	 * The public facing name of your extension.
	 */
	name: string;

	/**
	 * The public facing description of your extension.
	 */
	description: string;

	/**
	 * Optional keywords used by Beak when searching for variables when the user is
	 * typing.
	 */
	keywords?: string[];

	/**
	 * Denotes if the value's output is sensitive, and will be hidden by default in the UI
	 * and in copied responses.
	 */
	sensitive: boolean;

	/**
	 * Attributes that define when and how this value should be shown.
	 */
	attributes: Attributes;
}

export interface Variable<TPayload extends GenericDictionary> extends VariableGetter<TPayload>, VariableStaticInformation {

	/**
	 * Creates a default payload, if the user doesn't specify any data.
	 * @param {Context} ctx The project context.
	 */
	createDefaultPayload: (ctx: Context) => Promise<TPayload>;

	/**
	 * Gets a name for the variable, with context of the payload of this specific instance of the variable.
	 * @param {TPayload} payload This instance of the value's payload data.
	 */
	getContextAwareName?: (payload: TPayload) => string;
}

export interface EditableVariable<TPayload extends GenericDictionary, TEditorState extends GenericDictionary = TPayload> extends Variable<TPayload> {

	/**
	 * Details how Beak and user's should interact with the value editor for your
	 * variable.
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
	 * If the payload data isn't the same as the editor state, this will convert
	 * Payload -> State. This is optional if no modification of the payload is needed to
	 * create the editor state.
	 * @param {Context} ctx The project context.
	 * @param {TPayload} payload This instance of the value's payload data.
	 */
	load?: (ctx: Context, payload: TPayload) => Promise<TEditorState>;

	/**
	 * If the payload data isn't the same as the editor state, this will convert
	 * State -> Payload. This is optional if no modification of the state is needed to
	 * create the payload.
	 * @param {Context} ctx The project context.
	 * @param {TPayload} existingPayload This existing instance of the value's payload data.
	 * @param {TEditorState} state This instance of the updated state data.
	 */
	save?: (ctx: Context, existingPayload: TPayload, state: TEditorState) => Promise<TPayload>;
}

export type UISection<T extends GenericDictionary = Record<string, never>> =
	ValuePartInput<T> |
	TextInput<T> |
	NumberInput<T> |
	CheckboxInput<T> |
	OptionsInput<T> |
	RequestSelectInput<T>;

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
	parseValueSections: (ctx: Context, parts: unknown[]) => Promise<string>;

	log: (level: Level, message: string) => void;
}
