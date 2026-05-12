import { TypedObject } from '@beak/common/helpers/typescript';
import type { FlightRequest, FlightRequestKeyValue } from '@beak/core/flight';
import type { RequestBodyFile, RequestBodyText, RequestOverview, ToggleKeyValue } from '@getbeak/types/request';
import type { Context, ValueSections } from '@getbeak/types/values';

/**
 * Side-effecting helpers that prepareRequest needs in order to resolve
 * realtime-value parts, build the final URL, transform body payloads, and
 * read referenced files. Injected so prepareRequest stays a pure function
 * of its inputs and is unit-testable without saga / IPC plumbing.
 */
export interface PrepareRequestDeps {
	parseValueSections: (context: Context, valueParts: ValueSections) => Promise<string>;
	// URL result only needs to be stringifiable — both the native `URL` and `url-parse`'s `URLParse` satisfy this.
	convertRequestToUrl: (context: Context, overview: RequestOverview) => Promise<{ toString(): string }>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	convertToRealJson: (context: Context, payload: any) => Promise<unknown>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	convertKeyValueToString: (context: Context, payload: any) => Promise<string>;
	readReferencedFile: (fileReferenceId: string) => Promise<{ body: Uint8Array }>;

	requestAllowsBody: (verb: string) => boolean;
	requestBodyContentType: (body: RequestOverview['body']) => string | undefined;

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
			out[k] = {
				enabled: toggleValueSections[k].enabled,
				name: toggleValueSections[k].name,
				value: [await deps.parseValueSections(context, toggleValueSections[k].value)],
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
): Promise<RequestBodyText | RequestBodyFile> {
	const { body, verb } = overview;

	if (!deps.requestAllowsBody(verb)) return { type: 'text', payload: '' };

	switch (body.type) {
		case 'text':
			return body;
		case 'json': {
			const json = await deps.convertToRealJson(context, body.payload);
			return { type: 'text', payload: JSON.stringify(json) };
		}
		case 'url_encoded_form':
			return { type: 'text', payload: await deps.convertKeyValueToString(context, body.payload) };
		case 'file': {
			try {
				const response = await deps.readReferencedFile(body.payload.fileReferenceId!);
				return {
					type: 'file',
					payload: { ...body.payload, __hacky__binaryFileData: response.body },
				};
			} catch (error) {
				console.error('unable to read reference file', error);
				return { type: 'text', payload: '' };
			}
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

function hasHeader(header: string, headers: Record<string, ToggleKeyValue>) {
	return Boolean(TypedObject.values(headers).find(h => h.enabled && h.name.toLowerCase() === header.toLowerCase()));
}
