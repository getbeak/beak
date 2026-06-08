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
 *   "beak": { "apiVersion": 2 }
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
 *       resolve: (_extCtx, _ctx, payload) => ({
 *         kind: 'text',
 *         text: payload.format === 'iso'
 *           ? new Date().toISOString()
 *           : String(Math.floor(Date.now() / 1000)),
 *       }),
 *     }),
 *   ],
 * });
 * ```
 *
 * Beak runs each extension in an isolated V8 context. The extension does
 * not have network, filesystem, or process access; the only host-provided
 * functionality is what arrives on the `ExtensionContext` argument.
 *
 * The single `resolve` callback returns a typed {@link ResolvedValue} —
 * text, bytes, an asset ref, or a byte stream. The renderer negotiates
 * between the producer's kind and the consumer's {@link Sink} via a
 * fixed coercion table — see ADR-0007.
 */

import type { Context as VariableContextType } from '@getbeak/types/values';

export type { ValueSection, ValueSections } from '@getbeak/types/values';

export { toWebSafeBase64 } from './utils/base64';
export { arrayBufferToHexString } from './utils/encoding';

/* -------------------------------------------------------------------------- */
/*  Versioning                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Major version of the extension API. Beak refuses to load extensions
 * declaring any other major. v1 (pre-ADR-0007: `getValue` + optional
 * `getAssetRef`) is retired; declarations of `apiVersion: 1` fail loudly.
 */
export const CURRENT_API_VERSION = 2 as const;
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
	 * Recurse into Beak's variable system to resolve nested value-sections
	 * as text. Useful when a variable's payload contains its own
	 * value-sections (e.g. a hash of a templated input).
	 */
	parseValueSections: (varCtx: VariableContext, parts: unknown[]) => Promise<string>;
}

/* -------------------------------------------------------------------------- */
/*  Assets                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Content-addressed pointer to a binary asset stored under the project's
 * `_assets/` directory. Variables that resolve to existing project bytes
 * (file uploads, decoded response bodies, etc.) return one of these from
 * `resolve` instead of materialising the bytes inline.
 *
 * The internal canonical schema lives in `@beak/common/types/asset-ref`;
 * this interface is the structurally-mirrored public surface — keep them
 * in sync.
 */
export interface AssetRef {
	sha256: string;
	size: number;
	contentType?: string;
}

/* -------------------------------------------------------------------------- */
/*  ResolvedValue + Sink                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The four shapes a variable can resolve to. Producers pick whichever is
 * cheapest to express the value naturally; consumers declare a {@link Sink}
 * and the host coerces between them via a fixed table — see ADR-0007.
 *
 * - `text` — a UTF-8 string. The cheapest default.
 * - `bytes` — an in-memory `Uint8Array`. Cheap for small computed values
 *   like signatures or encoded protobufs.
 * - `asset` — a content-addressed pointer into the project's `_assets/`
 *   store. The wire layer reads bytes on demand; the renderer never
 *   materialises them.
 * - `stream` — a producer that emits bytes lazily. Used for streaming
 *   uploads and for chaining a live response into a follow-up request.
 */
export type ResolvedValue =
	| { kind: 'text'; text: string; contentType?: string }
	| { kind: 'bytes'; bytes: Uint8Array; contentType?: string }
	| { kind: 'asset'; ref: AssetRef }
	| { kind: 'stream'; stream: ReadableStream<Uint8Array>; size?: number; contentType?: string };

/**
 * The kind of value a consumer wants. Picked by the renderer based on
 * where the value is going on the wire:
 *
 * - `text` — headers, URL parts, query string, JSON property values,
 *   GraphQL variables, form fields.
 * - `binary` — file body, multipart binary parts. Bytes-in-hand.
 * - `stream` — streaming uploads, response-as-input. The consumer is
 *   prepared to iterate over chunks.
 */
export type Sink = { kind: 'text' } | { kind: 'binary' } | { kind: 'stream' };

/**
 * Argument bag passed to every `resolve` callback. Carries the variable
 * context, the sink the consumer is asking for, and the current recursion
 * depth (used by host-side variables that recurse into `parseValueSections`).
 *
 * Implementations may inspect `sink.kind` to choose the cheapest output —
 * but they are not required to. A variable that always returns text is
 * still valid; the coercion table handles the rest.
 */
export interface ResolveContext {
	variableContext: VariableContext;
	sink: Sink;
	depth: number;
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

	/**
	 * Resolve the variable for a specific consumer sink. The returned
	 * {@link ResolvedValue} may use any kind regardless of `ctx.sink.kind`;
	 * the host coerces. Implementations that *can* honour the sink cheaply
	 * should — e.g. a file-reading variable returning `{ kind: 'asset' }`
	 * for a binary sink avoids a needless UTF-8 round-trip.
	 */
	resolve: (extCtx: ExtensionContext, ctx: ResolveContext, payload: TPayload) => Promise<ResolvedValue> | ResolvedValue;

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
	/** Authoring API the extension targets. Currently always `2`. */
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
 * Shape used by Beak's built-in RTVs and by the adapter that wraps
 * extension-contributed variables for the renderer registry. Same shape
 * as {@link VariableDefinition} but with the host's narrower call
 * signatures — no `ExtensionContext`, since built-ins talk to the host
 * directly.
 *
 * @internal
 */
export interface Variable<TPayload> extends VariableStaticInformation {
	createDefaultPayload: (ctx: VariableContext) => Promise<TPayload>;
	resolve: (ctx: ResolveContext, payload: TPayload) => Promise<ResolvedValue>;
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
