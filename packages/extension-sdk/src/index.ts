/**
 * Public SDK for authoring Beak extensions.
 *
 * Extension authors import the variable/value type contracts from here, plus
 * optional utility helpers. They describe a variable handler that matches the
 * `Variable` / `EditableVariable` shape; **Beak itself decides what gets
 * registered** based on which extension packages are installed in the project.
 * Extensions cannot mutate Beak's registry directly.
 */

import type { Context } from '@getbeak/types/values';

export type { Context, ValueSection, ValueSections } from '@getbeak/types/values';

export { toWebSafeBase64 } from './utils/base64';
export { arrayBufferToHexString } from './utils/encoding';

/* biome-ignore lint/suspicious/noEmptyInterface: augmentation target — the host renderer extends this with `type` and `external`. */
export interface VariableBase {}

interface VariableGetter<TPayload> {
	/**
	 * Gets the string value of the value, given the payload body.
	 * @param ctx The project context.
	 * @param payload This instance of the value's payload data.
	 * @param recursiveDepth The current depth of value recursion.
	 */
	getValue: (ctx: Context, payload: TPayload, recursiveDepth: number) => Promise<string>;
}

// biome-ignore lint/suspicious/noEmptyInterface: marker constraint; extensions define their own payload shapes
interface GenericDictionary {}

export interface VariableStaticInformation extends VariableBase {
	/** The public facing name of your extension. */
	name: string;
	/** The public facing description of your extension. */
	description: string;
	/** Optional keywords used by Beak when searching for variables when the user is typing. */
	keywords?: string[];
	/** Denotes if the value's output is sensitive, hidden by default in the UI and in copied responses. */
	sensitive: boolean;
	/** Attributes that define when and how this value should be shown. */
	attributes: Attributes;
}

export interface Variable<TPayload extends GenericDictionary>
	extends VariableGetter<TPayload>,
		VariableStaticInformation {
	/** Creates a default payload, if the user doesn't specify any data. */
	createDefaultPayload: (ctx: Context) => Promise<TPayload>;
	/** Gets a name for the variable, given the payload of this specific instance. */
	getContextAwareName?: (payload: TPayload) => string;
}

export interface EditableVariable<
	TPayload extends GenericDictionary,
	TEditorState extends GenericDictionary = TPayload,
> extends Variable<TPayload> {
	/** Details how Beak and users should interact with the value editor for your variable. */
	editor: Editor<TPayload, TEditorState>;
}

interface Attributes {
	/** If true, this value only appears in the variable selector when there's a request in context. */
	requiresRequestId?: boolean;
}

interface Editor<TPayload extends GenericDictionary, TEditorState extends GenericDictionary> {
	createUserInterface: (ctx: Context) => Promise<UISection<TEditorState>[]>;
	load?: (ctx: Context, payload: TPayload) => Promise<TEditorState>;
	save?: (ctx: Context, existingPayload: TPayload, state: TEditorState) => Promise<TPayload>;
}

export type UISection<T extends GenericDictionary = Record<string, never>> =
	| ValuePartInput<T>
	| TextInput<T>
	| NumberInput<T>
	| CheckboxInput<T>
	| OptionsInput<T>
	| RequestSelectInput<T>;

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
