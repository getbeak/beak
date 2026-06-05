import type { EntryMap } from '@getbeak/types/body-editor-json';
import type { RequestBody, RequestBodyType, ToggleKeyValue } from '@getbeak/types/request';
import type { Context } from '@getbeak/types/values';

/**
 * Pure state machine for body-type changes — the transitions that
 * previously lived inline in `use-change-body-type.ts` as 200+ lines of
 * `if (oldType === X && newType === Y)` branches.
 *
 * Extracted so the rules are testable without React + Redux, and so the
 * UI hook can stay focused on its UI-flavoured concerns: the
 * "switch-to-GraphQL" schema-source dialog and the "this will lose your
 * body" confirmation. The transition table itself is pure.
 *
 * Off-the-grid types: `grpc` and `file` aren't switchable through this
 * surface — `Discover` creates gRPC bodies directly, and the editor
 * never asks "convert text → file". `transitionBody` returns the
 * appropriate empty body when asked for a transition into either kind.
 */

/**
 * Transitions that need to resolve value-parts (variables, response
 * extractions, etc) before stringification get the helpers from here.
 * Mirrors the `prepare-request` deps pattern so callers wire one
 * dependency bag once at the call site.
 */
export interface BodyTransitionDeps {
	convertToRealJson: (context: Context, payload: EntryMap) => Promise<unknown>;
	convertKeyValueToString: (context: Context, payload: Record<string, ToggleKeyValue>) => Promise<string>;
	/** Generate a fresh entry id for a synthesised JSON/GraphQL root entry. */
	generateEntryId: () => string;
	/**
	 * Tokenise a plain text payload into a JSON entry-map. Used when the
	 * user types text and switches to structured JSON — we attempt to parse
	 * it first so they don't lose their pasted JSON. Defined by the renderer
	 * (text → JSON parser is renderer-only logic) and injected here.
	 */
	textToEntryJson: (text: string) => EntryMap;
	/** Parse `a=1&b=2` style text into the url-encoded-form payload. */
	textToUrlEncodedForm: (text: string) => Record<string, ToggleKeyValue>;
}

export interface TransitionOptions {
	/** Existing schemaSeed from a json_raw body — preserves authored schema across the switch. */
	schemaSeed?: EntryMap;
}

/**
 * Compute the new body payload for a type change. Pure: takes the old
 * body + the desired new type, returns the new body. Does not dispatch;
 * does not show dialogs. The hook layer handles confirmation and
 * dispatch.
 *
 * gRPC is unreachable here — callers gate that out upstream. If the
 * caller asks anyway we just hand back an empty `{ type, payload }`
 * stub matching the requested type, so reducer schemas don't blow up.
 */
export async function transitionBody(
	oldBody: RequestBody,
	newType: RequestBodyType,
	context: Context,
	deps: BodyTransitionDeps,
	options: TransitionOptions = {},
): Promise<RequestBody> {
	if (newType === oldBody.type) return oldBody;
	if (newType === 'grpc') return createEmptyBody(newType, deps);

	// text → ... — try to preserve the user's typed content.
	if (oldBody.type === 'text') {
		if (newType === 'json') return { type: 'json', payload: deps.textToEntryJson(oldBody.payload) };
		if (newType === 'json_raw') return { type: 'json_raw', payload: oldBody.payload };
		if (newType === 'url_encoded_form')
			return { type: 'url_encoded_form', payload: deps.textToUrlEncodedForm(oldBody.payload) };
		if (newType === 'graphql') return { type: 'graphql', payload: { query: oldBody.payload, variables: {} } };
		// fallthrough → empty body of the target type
		return createEmptyBody(newType, deps);
	}

	// json_raw ↔ json — preserve `schemaSeed` round-trips so the user can
	// flip back to structured mode without losing their authored schema.
	if (oldBody.type === 'json_raw' && newType === 'json') {
		if (options.schemaSeed && Object.keys(options.schemaSeed).length > 0) {
			return { type: 'json', payload: options.schemaSeed };
		}
		let parsed: unknown = {};
		try {
			parsed = JSON.parse(oldBody.payload || '{}');
		} catch {
			/* keep parsed = {} */
		}
		return { type: 'json', payload: deps.textToEntryJson(JSON.stringify(parsed)) };
	}
	if (oldBody.type === 'json' && newType === 'json_raw') {
		const real = await deps.convertToRealJson(context, oldBody.payload);
		return { type: 'json_raw', payload: JSON.stringify(real, null, '\t'), schemaSeed: oldBody.payload };
	}

	// json_raw → text: lift the string straight across.
	if (oldBody.type === 'json_raw' && newType === 'text') {
		return { type: 'text', payload: oldBody.payload };
	}

	// json ↔ graphql — share variables across the boundary.
	if (newType === 'json' && oldBody.type === 'graphql') {
		return { type: 'json', payload: oldBody.payload.variables };
	}
	if (newType === 'graphql' && oldBody.type === 'json') {
		return { type: 'graphql', payload: { query: '', variables: oldBody.payload } };
	}

	// → text: stringify the source body so the user keeps their content.
	if (newType === 'text') {
		if (oldBody.type === 'json') {
			const normalised = JSON.stringify(await deps.convertToRealJson(context, oldBody.payload), null, '\t');
			return { type: 'text', payload: normalised === '""' ? '' : normalised };
		}
		if (oldBody.type === 'url_encoded_form') {
			return { type: 'text', payload: await deps.convertKeyValueToString(context, oldBody.payload) };
		}
		if (oldBody.type === 'graphql') {
			return { type: 'text', payload: oldBody.payload.query };
		}
		return { type: 'text', payload: '' };
	}

	// Anything not explicitly covered → empty body of the target type.
	return createEmptyBody(newType, deps);
}

/**
 * Construct an empty body of the requested type. The shape mirrors
 * what the reducer + flight machinery expect for a "blank slate" body
 * — JSON / GraphQL get a single synthesised object root entry so the
 * structured editor has something to render.
 */
export function createEmptyBody(type: RequestBodyType, deps: BodyTransitionDeps): RequestBody {
	switch (type) {
		case 'url_encoded_form':
			return { type, payload: {} };
		case 'json': {
			const id = deps.generateEntryId();
			return { type, payload: { [id]: { id, parentId: null, type: 'object', enabled: true } } };
		}
		case 'file':
			return { type, payload: { fileReferenceId: undefined, contentType: undefined } };
		case 'graphql': {
			const id = deps.generateEntryId();
			return {
				type,
				payload: { query: '', variables: { [id]: { id, parentId: null, type: 'object', enabled: true } } },
			};
		}
		case 'grpc':
			return { type, payload: { service: '', method: '', requestJson: '{\n\t\n}' } };
		case 'json_raw':
			return { type, payload: '' };
		case 'text':
		default:
			return { type: 'text', payload: '' };
	}
}
