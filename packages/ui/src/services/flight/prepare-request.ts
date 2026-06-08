import { TypedObject } from '@beak/common/helpers/typescript';
import type { FlightBodyMultipart, FlightMultipartPart } from '@beak/common/types/multipart';
import type { ValueProducerHandle } from '@beak/common/types/value-producers';
import type { FlightRequest, FlightRequestKeyValue } from '@beak/state/flight';
import type { ResolvedValue, Sink } from '@getbeak/extension-sdk';
import type {
	MultipartPart,
	MultipartPartBinary,
	MultipartPartText,
	RequestBodyFile,
	RequestBodyText,
	RequestOverview,
	ToggleKeyValue,
} from '@getbeak/types/request';
import type { Context, ValueSections } from '@getbeak/types/values';

/**
 * Side-effecting helpers that prepareRequest needs in order to resolve
 * realtime-value parts, build the final URL, transform body payloads, and
 * read referenced files. Injected so prepareRequest stays a pure function
 * of its inputs and is unit-testable without saga / IPC plumbing.
 */
export interface PrepareRequestDeps {
	parseValueSections: (context: Context, valueParts: ValueSections) => Promise<string>;
	/**
	 * Resolve a {@link ValueSections} array against a consumer {@link Sink}.
	 * The renderer-side resolver implements this; injected so prepare-request
	 * stays unit-testable without pulling in the variable registry.
	 */
	resolveValueSections: (context: Context, parts: ValueSections, sink: Sink) => Promise<ResolvedValue>;
	// URL result only needs to be stringifiable — both the native `URL` and `url-parse`'s `URLParse` satisfy this.
	convertRequestToUrl: (context: Context, overview: RequestOverview) => Promise<{ toString(): string }>;
	// biome-ignore lint/suspicious/noExplicitAny: payload is an arbitrarily-nested JSON tree with embedded value-section parts
	convertToRealJson: (context: Context, payload: any) => Promise<unknown>;
	// biome-ignore lint/suspicious/noExplicitAny: payload is an arbitrarily-nested JSON tree with embedded value-section parts
	convertKeyValueToString: (context: Context, payload: any) => Promise<string>;
	readReferencedFile: (fileReferenceId: string) => Promise<{ body: Uint8Array }>;

	requestAllowsBody: (verb: string) => boolean;
	requestBodyContentType: (body: RequestOverview['body']) => string | undefined;

	/**
	 * Mint a fresh multipart boundary string. Defaults to a ksuid-derived
	 * value; injected so tests can pin it down for deterministic output.
	 */
	generateBoundary: () => string;
	/**
	 * Register a {@link ReadableStream} producer with the per-flight stream
	 * registry and return its handle. Implemented by the renderer wiring; the
	 * requester pulls chunks back over IPC. Returns `null` when streaming
	 * isn't wired (some tests / web host).
	 */
	registerStream?: (stream: ReadableStream<Uint8Array>, size?: number, contentType?: string) => string;

	userAgent: string;
	/** Generate a stable unique id for a synthesized header / query entry. */
	generateId: (kind: 'header' | 'query') => string;
}

export async function prepareRequest(
	overview: RequestOverview,
	context: Context,
	deps: PrepareRequestDeps,
): Promise<FlightRequest> {
	const url = await deps.convertRequestToUrl(context, overview);
	const headers = await flattenToggleValueSections(context, overview.headers, deps);

	if (!hasHeader('user-agent', headers)) {
		headers[deps.generateId('header')] = {
			name: 'User-Agent',
			value: [deps.userAgent],
			enabled: true,
		};
	}

	if (!hasHeader('content-type', headers) && deps.requestAllowsBody(overview.verb)) {
		const contentType = deps.requestBodyContentType(overview.body);
		if (contentType) {
			headers[deps.generateId('header')] = {
				name: 'Content-Type',
				value: [contentType],
				enabled: true,
			};
		}
	}

	return {
		...overview,
		url: [url.toString()],
		query: await flattenQuery(context, overview, deps),
		headers,
		body: await flattenBody(context, overview, deps),
	};
}

async function flattenToggleValueSections(
	context: Context,
	toggleValueSections: Record<string, ToggleKeyValue>,
	deps: PrepareRequestDeps,
): Promise<Record<string, FlightRequestKeyValue>> {
	const out: Record<string, FlightRequestKeyValue> = {};
	await Promise.all(
		TypedObject.keys(toggleValueSections).map(async k => {
			const entry = toggleValueSections[k];
			// Empty-keyed rows are placeholders the user hasn't finished editing
			// yet — sending them produces `: value` headers or `=value` query
			// strings, which is never what they meant. Skip them at the prepare
			// boundary so the outgoing wire stays clean (the editor still
			// flags them visually for the user to fix).
			if (!entry.name || entry.name.trim().length === 0) return;
			out[k] = {
				enabled: entry.enabled,
				name: entry.name,
				value: [await deps.parseValueSections(context, entry.value)],
			};
		}),
	);
	return out;
}

async function flattenQuery(
	context: Context,
	overview: RequestOverview,
	deps: PrepareRequestDeps,
): Promise<Record<string, FlightRequestKeyValue>> {
	const { body, query, verb } = overview;
	const resolvedQuery = await flattenToggleValueSections(context, query, deps);

	// When using GraphQL with body-less verbs, the query needs to ride along on the URL.
	if (!deps.requestAllowsBody(verb) && body.type === 'graphql') {
		const existingQueryId = Object.keys(resolvedQuery).find(k => resolvedQuery[k].name.toLocaleLowerCase() === 'query');
		const queryId = existingQueryId ?? deps.generateId('query');
		resolvedQuery[queryId] = {
			enabled: true,
			name: 'query',
			value: [body.payload.query],
		};
	}

	return resolvedQuery;
}

async function flattenBody(
	context: Context,
	overview: RequestOverview,
	deps: PrepareRequestDeps,
): Promise<RequestBodyText | RequestBodyFile | FlightBodyMultipart> {
	const { body, verb } = overview;

	if (!deps.requestAllowsBody(verb)) return { type: 'text', payload: '' };

	switch (body.type) {
		case 'text':
			return body;
		case 'json_raw':
			return { type: 'text', payload: body.payload };
		case 'json': {
			const json = await deps.convertToRealJson(context, body.payload);
			return { type: 'text', payload: JSON.stringify(json) };
		}
		case 'url_encoded_form':
			return { type: 'text', payload: await deps.convertKeyValueToString(context, body.payload) };
		case 'file': {
			const producer = await fileBodyProducer(context, body.payload, deps);
			if (producer === null) return { type: 'text', payload: '' };
			return {
				type: 'file',
				payload: { ...body.payload, producer },
			};
		}
		case 'multipart': {
			const boundary = body.payload.boundary ?? deps.generateBoundary();
			const parts: FlightMultipartPart[] = [];
			for (const part of body.payload.parts) {
				const flattened = await flattenMultipartPart(context, part, deps);
				if (flattened) parts.push(flattened);
			}
			return { type: 'multipart', payload: { boundary, parts } };
		}
		case 'graphql': {
			const variables = await deps.convertToRealJson(context, body.payload.variables);
			return {
				type: 'text',
				payload: JSON.stringify({ query: body.payload.query, variables }),
			};
		}
		default:
			throw new Error('unknown_body_type');
	}
}

async function fileBodyProducer(
	_context: Context,
	payload: RequestBodyFile['payload'],
	deps: PrepareRequestDeps,
): Promise<ValueProducerHandle | null> {
	if (payload.assetRef) {
		return { kind: 'asset', ref: payload.assetRef };
	}
	if (payload.fileReferenceId) {
		try {
			const { body: bytes } = await deps.readReferencedFile(payload.fileReferenceId);
			return { kind: 'inline', bytes, contentType: payload.contentType };
		} catch (error) {
			console.error('unable to read reference file', error);
			return null;
		}
	}
	return null;
}

async function flattenMultipartPart(
	context: Context,
	part: MultipartPart,
	deps: PrepareRequestDeps,
): Promise<FlightMultipartPart | null> {
	const name = await deps.parseValueSections(context, part.name);
	if (!name) return null;

	if (part.kind === 'text') return flattenMultipartTextPart(context, part, name, deps);
	return flattenMultipartBinaryPart(context, part, name, deps);
}

async function flattenMultipartTextPart(
	context: Context,
	part: MultipartPartText,
	name: string,
	deps: PrepareRequestDeps,
) {
	const value = await deps.parseValueSections(context, part.value);
	return { kind: 'text' as const, name, value, contentType: part.contentType };
}

async function flattenMultipartBinaryPart(
	context: Context,
	part: MultipartPartBinary,
	name: string,
	deps: PrepareRequestDeps,
): Promise<FlightMultipartPart | null> {
	const filename = part.filename ? await deps.parseValueSections(context, part.filename) : undefined;
	const contentType = part.contentType ? await deps.parseValueSections(context, part.contentType) : undefined;
	const resolved = await deps.resolveValueSections(context, part.value, { kind: 'binary' });
	const source = await resolvedToProducer(resolved, deps);
	if (!source) return null;
	return {
		kind: 'binary' as const,
		name,
		filename,
		contentType,
		source,
	};
}

async function resolvedToProducer(rv: ResolvedValue, deps: PrepareRequestDeps): Promise<ValueProducerHandle | null> {
	switch (rv.kind) {
		case 'asset':
			return { kind: 'asset', ref: rv.ref };
		case 'bytes':
			return { kind: 'inline', bytes: rv.bytes, contentType: rv.contentType };
		case 'text':
			return { kind: 'inline', bytes: new TextEncoder().encode(rv.text), contentType: 'text/plain; charset=utf-8' };
		case 'stream': {
			if (!deps.registerStream) {
				// Streaming sink without registry wiring — drain to bytes so the
				// requester can still ship the request. Less efficient but the
				// safe fallback for tests / the web host until the registry lands.
				const reader = rv.stream.getReader();
				const chunks: Uint8Array[] = [];
				let total = 0;
				try {
					while (true) {
						const { value, done } = await reader.read();
						if (done) break;
						chunks.push(value);
						total += value.byteLength;
					}
				} finally {
					reader.releaseLock();
				}
				const merged = new Uint8Array(total);
				let offset = 0;
				for (const c of chunks) {
					merged.set(c, offset);
					offset += c.byteLength;
				}
				return { kind: 'inline', bytes: merged, contentType: rv.contentType };
			}
			const streamId = deps.registerStream(rv.stream, rv.size, rv.contentType);
			return { kind: 'stream', streamId, size: rv.size, contentType: rv.contentType };
		}
	}
}

function hasHeader(header: string, headers: Record<string, ToggleKeyValue>) {
	return Boolean(TypedObject.values(headers).find(h => h.enabled && h.name.toLowerCase() === header.toLowerCase()));
}
