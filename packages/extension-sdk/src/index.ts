/**
 * Public SDK for authoring Beak extensions.
 *
 * The recommended entry point is `defineExtension({ manifest, variables: [...] })`.
 * One extension package can contribute multiple variables. The default export
 * of the package's `main` script must be the result of `defineExtension`.
 *
 * Authors target a stable `apiVersion` in their `package.json` under the
 * `beak` key — Beak refuses to load extensions whose `apiVersion` it does
 * not understand. This is the forward-compatibility seam.
 *
 * ```jsonc
 * // package.json
 * {
 *   "name": "@example/timestamp-ext",
 *   "version": "1.0.0",
 *   "main": "dist/index.js",
 *   "beak": { "apiVersion": 1 }
 * }
 * ```
 *
 * ```ts
 * // src/index.ts
 * import { defineExtension, defineVariable } from '@getbeak/extension-sdk';
 *
 * export default defineExtension({
 *   variables: [
 *     defineVariable<{ format: 'unix' | 'iso' }>({
 *       id: 'timestamp',
 *       name: 'Timestamp',
 *       description: 'Current timestamp',
 *       createDefaultPayload: () => ({ format: 'unix' }),
 *       getValue: (_extCtx, _varCtx, payload) =>
 *         payload.format === 'iso'
 *           ? new Date().toISOString()
 *           : String(Math.floor(Date.now() / 1000)),
 *     }),
 *   ],
 * });
 * ```
 *
 * Beak runs each extension in an isolated V8 context. The extension does
 * not have network, filesystem, or process access; the only host-provided
 * functionality is what arrives on the `ExtensionContext` argument.
 */

import type { Context as VariableContextType } from '@getbeak/types/values';

export type { ValueSection, ValueSections } from '@getbeak/types/values';

export { toWebSafeBase64 } from './utils/base64';
export { arrayBufferToHexString } from './utils/encoding';

/* -------------------------------------------------------------------------- */
/*  Versioning                                                                */
/* -------------------------------------------------------------------------- */

/** Major version of the extension API. Beak refuses to load other majors. */
export const CURRENT_API_VERSION = 1 as const;
export type ApiVersion = typeof CURRENT_API_VERSION;

/* -------------------------------------------------------------------------- */
/*  Variable execution context                                                */
/* -------------------------------------------------------------------------- */

/**
 * Per-call context: which project + request + flight a variable resolution
 * is happening for. Identical shape to the historical `Context` —
 * re-exported so extension authors can still spell it `Context`.
 */
export type VariableContext = VariableContextType;
export type { VariableContextType as Context };

type Level = 'info' | 'warn' | 'error';

/**
 * Host-provided helpers handed to every lifecycle callback. Replaces the
 * old `beakApi` global — easier to sandbox, easier to test.
 */
export interface ExtensionContext {
	/** Structured log line that appears in Beak's logs tagged with the extension's id. */
	log: (level: Level, message: string) => void;
	/**
	 * Recurse into Beak's variable system. Useful when a variable's
	 * payload contains its own value-sections (e.g. nested variables).
	 */
	parseValueSections: (varCtx: VariableContext, parts: unknown[]) => Promise<string>;
}

/* -------------------------------------------------------------------------- */
/*  Assets                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Content-addressed pointer to a binary asset stored under the project's
 * `_assets/` directory. Variables that produce binary content (file uploads,
 * decoded response bodies, etc.) return one of these from `getAssetRef`
 * instead of stringifying through `getValue`.
 */
export interface AssetRef {
	sha256: string;
	size: number;
	contentType?: string;
}

/* -------------------------------------------------------------------------- */
/*  Variable definition                                                       */
/* -------------------------------------------------------------------------- */

export interface VariableAttributes {
	/** Hide the variable from non-request contexts (URL bar, header editor, etc.). */
	requiresRequestId?: boolean;
}

export interface VariableDefinition<TPayload = unknown, TEditorState = TPayload> {
	/**
	 * Stable identifier for the variable inside this extension. Combined
	 * with the package name to form the fully-qualified type Beak uses
	 * internally (`external:<package-name>/<id>`). Must be unique across
	 * the extension and stable across versions — renaming this is a
	 * breaking change for any project referencing the variable.
	 */
	id: string;
	/** Display name shown in the variable picker. */
	name: string;
	/** Short description shown alongside the name. */
	description: string;
	/** Marks the value as sensitive — hidden by default in UI/copy. */
	sensitive?: boolean;
	/** Search keywords surfaced when the user types in the variable picker. */
	keywords?: string[];
	/** Attributes that gate when the variable is offered. */
	attributes?: VariableAttributes;

	/** Build the default payload for a fresh insertion of this variable. */
	createDefaultPayload: (extCtx: ExtensionContext, varCtx: VariableContext) => Promise<TPayload> | TPayload;

	/** Resolve the variable to a string value. */
	getValue: (
		extCtx: ExtensionContext,
		varCtx: VariableContext,
		payload: TPayload,
		recursiveDepth: number,
	) => Promise<string> | string;

	/**
	 * Optional binary resolver. Implement when the variable naturally
	 * resolves to bytes (file uploads, decoded responses). When the
	 * consumer is a binary sink (e.g. a `file` request body), Beak
	 * prefers `getAssetRef`. String sinks still go through `getValue`.
	 * Returning `null` falls back to `getValue`.
	 */
	getAssetRef?: (
		extCtx: ExtensionContext,
		varCtx: VariableContext,
		payload: TPayload,
		recursiveDepth: number,
	) => Promise<AssetRef | null> | AssetRef | null;

	/** Override the display name based on the current payload. */
	getContextAwareName?: (payload: TPayload) => string;

	/** Optional editor. Presence flips the variable to "user-editable" in the UI. */
	editor?: VariableEditor<TPayload, TEditorState>;
}

export interface VariableEditor<TPayload, TEditorState> {
	createUserInterface: (
		extCtx: ExtensionContext,
		varCtx: VariableContext,
	) => Promise<UISection<TEditorState>[]> | UISection<TEditorState>[];
	load?: (extCtx: ExtensionContext, varCtx: VariableContext, payload: TPayload) => Promise<TEditorState> | TEditorState;
	save?: (
		extCtx: ExtensionContext,
		varCtx: VariableContext,
		existingPayload: TPayload,
		state: TEditorState,
	) => Promise<TPayload> | TPayload;
}

/* -------------------------------------------------------------------------- */
/*  Editor UI schema                                                          */
/* -------------------------------------------------------------------------- */

export type UISection<T = Record<string, never>> =
	| ValuePartInput<T>
	| TextInput<T>
	| NumberInput<T>
	| CheckboxInput<T>
	| OptionsInput<T>
	| RequestSelectInput<T>;

interface UIInputBase<T> {
	stateBinding: keyof T;
	label?: string;
}

export interface ValuePartInput<T> extends UIInputBase<T> {
	type: 'value_parts_input';
}
export interface TextInput<T> extends UIInputBase<T> {
	type: 'string_input';
}
export interface NumberInput<T> extends UIInputBase<T> {
	type: 'number_input';
}
export interface CheckboxInput<T> extends UIInputBase<T> {
	type: 'checkbox_input';
}
export interface OptionsInput<T> extends UIInputBase<T> {
	type: 'options_input';
	options: { key: string; label: string }[];
}
export interface RequestSelectInput<T> extends UIInputBase<T> {
	type: 'request_select_input';
}

/* -------------------------------------------------------------------------- */
/*  Extension manifest + definition                                           */
/* -------------------------------------------------------------------------- */

/**
 * Optional in-code overrides for fields that would otherwise be read from
 * `package.json`. Most authors leave this empty.
 */
export interface ExtensionManifestOverrides {
	displayName?: string;
	description?: string;
	homepage?: string;
}

export interface ExtensionDefinition {
	/** Authoring API the extension targets. Currently always `1`. */
	apiVersion: ApiVersion;
	/** In-code overrides for `package.json`-sourced metadata. */
	manifest?: ExtensionManifestOverrides;
	/** Variables this extension contributes. */
	variables?: VariableDefinition<any, any>[];
}

/* -------------------------------------------------------------------------- */
/*  Authoring helpers                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Wrap an extension definition. Pass-through at runtime; exists so type
 * inference flows and so we can evolve the SDK without breaking the
 * authoring DSL.
 */
export function defineExtension(definition: Omit<ExtensionDefinition, 'apiVersion'>): ExtensionDefinition {
	return { apiVersion: CURRENT_API_VERSION, ...definition };
}

/**
 * Wrap a variable definition. Lets TypeScript infer `TPayload` /
 * `TEditorState` from the callbacks so authors rarely need to spell
 * generics by hand.
 */
export function defineVariable<TPayload, TEditorState = TPayload>(
	definition: VariableDefinition<TPayload, TEditorState>,
): VariableDefinition<TPayload, TEditorState> {
	return definition;
}

/* -------------------------------------------------------------------------- */
/*  Internal compatibility — used by built-in RTVs inside Beak itself.        */
/*  External authors should prefer `defineVariable` above.                    */
/* -------------------------------------------------------------------------- */

/* biome-ignore lint/suspicious/noEmptyInterface: augmentation target — the host renderer extends this with `type` and `external`. */
export interface VariableBase {}

export interface VariableStaticInformation extends VariableBase {
	name: string;
	description: string;
	keywords?: string[];
	sensitive: boolean;
	attributes: VariableAttributes;
}

/**
 * Legacy single-variable shape used by Beak's built-in RTVs. New extension
 * authors should use {@link defineVariable} + {@link defineExtension}
 * instead — this remains exported as an internal contract for the
 * renderer's built-in variable registry.
 *
 * @internal
 */
export interface Variable<TPayload> extends VariableStaticInformation {
	createDefaultPayload: (ctx: VariableContext) => Promise<TPayload>;
	getValue: (ctx: VariableContext, payload: TPayload, recursiveDepth: number) => Promise<string>;
	getAssetRef?: (ctx: VariableContext, payload: TPayload, recursiveDepth: number) => Promise<AssetRef | null>;
	getContextAwareName?: (payload: TPayload) => string;
}

/** @internal */
export interface EditableVariable<TPayload, TEditorState = TPayload> extends Variable<TPayload> {
	editor: {
		createUserInterface: (ctx: VariableContext) => Promise<UISection<TEditorState>[]>;
		load?: (ctx: VariableContext, payload: TPayload) => Promise<TEditorState>;
		save?: (ctx: VariableContext, existingPayload: TPayload, state: TEditorState) => Promise<TPayload>;
	};
}
