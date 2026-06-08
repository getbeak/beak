import ksuid from '@beak/ksuid';
import { type FlightRequest, type FlightRequestKeyValue, requestPureFlight } from '@beak/state/flight';
import EditorView from '@beak/ui/components/atoms/EditorView';
import useDebounce from '@beak/ui/hooks/use-debounce';
import binaryStore from '@beak/ui/lib/binary-store';
import { convertRequestToUrl } from '@beak/ui/services/url';
import {
	requestBodyGraphQlEditorQueryChanged,
	requestBodyGraphQlEditorReconcileVariables,
} from '@beak/ui/store/project/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box } from '@chakra-ui/react';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import type { RequestBodyGraphQl } from '@getbeak/types/request';
import type { FetcherParams } from '@graphiql/toolkit';
import { getIntrospectionQuery, type IntrospectionQuery, parse } from 'graphql';
import { Uri } from 'monaco-editor';
import { initializeMode } from 'monaco-graphql/initializeMode';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import useVariableContext from '../../variables/hooks/use-variable-context';
import { parseValueSections } from '../../variables/parser';
import { extractVariableNamesFromQuery } from '../utils';
import GraphQlError from './molecules/GraphQlError';
import GraphQlLoading from './molecules/GraphQlLoading';

export interface GraphQlQueryEditorProps {
	node: ValidRequestNode;
}

const schemaCache: Record<string, IntrospectionQuery> = {};

/**
 * Craft an explanatory error when the schema endpoint responds with no usable
 * body. Status drives the explanation — 401/403 hint at auth, 4xx more
 * broadly at request shape, 5xx at the server.
 */
function buildStatusError(status: number | undefined, decodedText: string): Error {
	if (status === 401 || status === 403)
		return new Error(
			`Schema endpoint returned HTTP ${status}. The endpoint likely requires authentication — add an Authorization header (or API token) to this request and hit Send again.`,
		);
	if (status === 404)
		return new Error(
			'Schema endpoint returned HTTP 404. Double-check the URL — many GraphQL servers expose introspection at a different path (e.g. /graphql).',
		);
	if (status === 405)
		return new Error(
			'Schema endpoint returned HTTP 405. Some servers only accept POST for GraphQL — confirm the verb on this request.',
		);
	if (typeof status === 'number' && status >= 400 && status < 500)
		return new Error(
			`Schema endpoint returned HTTP ${status}. The server rejected the introspection request — check the URL, headers, and that introspection is enabled.`,
		);
	if (typeof status === 'number' && status >= 500)
		return new Error(
			`Schema endpoint returned HTTP ${status}. The upstream server errored — try again, or check the endpoint's status page.`,
		);
	if (decodedText.length === 0)
		return new Error(
			'Schema endpoint returned an empty body. The endpoint may be down or refusing requests at the network level.',
		);
	return new Error('Schema endpoint returned no usable response.');
}

/**
 * Called when the endpoint returned 200 + parsable JSON but no `data`
 * payload. Surfaces the upstream `errors` array if present — many servers
 * disable introspection or return GraphQL-level rejections this way.
 */
function buildIntrospectionFailureError(status: number | undefined, jsonResponse: unknown): Error {
	const errors = (jsonResponse as { errors?: unknown[] } | null)?.errors;
	if (Array.isArray(errors) && errors.length > 0) {
		const messages = errors
			.map(e => (e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : null))
			.filter((m): m is string => Boolean(m));
		const joined = messages.join(' · ') || 'Server returned a GraphQL error response with no message.';
		const looksLikeIntrospectionDisabled = /introspect|disabled|denied|unauthor/i.test(joined);
		if (looksLikeIntrospectionDisabled)
			return new Error(`Introspection appears to be disabled on this endpoint. Server replied: ${joined}`);
		return new Error(`Schema endpoint responded with GraphQL errors: ${joined}`);
	}
	if (status === 401 || status === 403)
		return new Error(
			`Schema endpoint replied with HTTP ${status} and no schema. The endpoint likely requires authentication — add an Authorization header to this request.`,
		);
	return new Error(
		'Schema response missing `data` field. The endpoint replied successfully but did not return an introspection result.',
	);
}

const GraphQlQueryEditor: React.FC<GraphQlQueryEditorProps> = props => {
	const { node } = props;
	const dispatch = useDispatch();
	const [loading, setLoading] = useState(() => true);
	const [schemaFlightId, setSchemaFlightId] = useState<string>('impossible-yolo');
	const [hasSchema, setHasSchema] = useState(() => Boolean(schemaCache[node.id]));
	const [schemaFetchError, setSchemaFetchError] = useState<{ message: string } | null>(null);
	const variableSets = useAppSelector(s => s.global.variableSets.variableSets);
	const selectedSets = useAppSelector(s => s.global.preferences.editor.selectedVariableSets);
	const schemaFlight = useAppSelector(s => s.global.flight.flightHistories[node.id]?.history[schemaFlightId]);

	// The tree slice replaces nodes wholesale on every fs-watcher tick, so
	// `node.info.url`/`headers` are fresh array/object references on every
	// render even when their content hasn't changed. Passing those references
	// straight into `useDebounce` makes the debounce regenerate constantly,
	// which — combined with the success effect bumping state below — caused a
	// fire loop that hammered the upstream endpoint (e.g. GitHub's GraphQL
	// API rate-limited us). We collapse the deps into a single content-hash
	// string so the debounce only re-arms on meaningful change.
	const inputsKey = useMemo(
		() =>
			JSON.stringify({
				verb: node.info.verb,
				url: node.info.url,
				query: node.info.query,
				headers: node.info.headers,
				variableSets,
				selectedSets,
			}),
		[node.info.verb, node.info.url, node.info.query, node.info.headers, variableSets, selectedSets],
	);
	// Belt-and-braces: even with a stable hash a render burst could still
	// fire the debounce twice with identical inputs. Track the last key we
	// actually dispatched so we never fetch the same schema twice.
	const lastDispatchedKey = useRef<string | null>(null);

	const operationsUri = `${node.id}/operations.graphql`;
	const variablesUri = `${node.id}/variables.json`;
	const schemaUri = `${node.id}/schema.graphql`;

	const body = node.info.body as RequestBodyGraphQl;
	const context = useVariableContext(node.id);

	// TODO(afr): Also run this when schema _changes_
	useEffect(() => {
		const schema = schemaCache[node.id];

		if (!schema) return;

		initializeMode({
			diagnosticSettings: {
				validateVariablesJSON: {
					[Uri.file(operationsUri).toString()]: [Uri.file(variablesUri).toString()],
				},
				jsonDiagnosticSettings: {
					validate: true,
					schemaValidation: 'error',
					allowComments: true,
					trailingCommas: 'ignore',
				},
			},
			completionSettings: {
				__experimental__fillLeafsOnComplete: true,
			},
			schemas: [
				{
					introspectionJSON: schema,
					uri: schemaUri,
				},
			],
		});
	}, [node.id, setSchemaFetchError, hasSchema]);

	useEffect(() => {
		if (!schemaFlight) return;

		// Whatever happens below, the in-flight fetch has resolved one way or
		// another — release the loading screen so the editor or error pane can
		// take over. Without this reset, an empty-body or implicit failure
		// (where `schemaFlight.error` is undefined) leaves the spinner stuck.
		setLoading(false);

		const textDecoder = new TextDecoder();
		const binaryData = binaryStore.get(schemaFlight.binaryStoreKey) ?? new Uint8Array(0);
		const decodedText = textDecoder.decode(binaryData);
		const status = schemaFlight.response?.status;

		if (schemaFlight.error || !schemaFlight.response || !schemaFlight.response.hasBody || !decodedText) {
			setSchemaFetchError(schemaFlight.error ?? buildStatusError(status, decodedText));
			setHasSchema(false);

			return;
		}

		// TODO(afr): Validating this would be a good idea
		try {
			const jsonResponse = JSON.parse(decodedText);
			if (!jsonResponse?.data) {
				setSchemaFetchError(buildIntrospectionFailureError(status, jsonResponse));
				setHasSchema(false);
				return;
			}
			schemaCache[node.id] = jsonResponse.data as IntrospectionQuery;
			setSchemaFetchError(null);
			setHasSchema(true);
		} catch (err) {
			setSchemaFetchError(err instanceof Error ? err : new Error(String(err)));
			setHasSchema(false);
		}
	}, [schemaFlight?.flightId]);

	useDebounce(
		async () => {
			// Skip if we've already dispatched a schema fetch for this exact
			// inputs hash — covers both the "render burst" path and the case
			// where a previous fetch failed (the user has to change something
			// meaningful for us to retry, otherwise we'd dogpile a broken endpoint).
			if (lastDispatchedKey.current === inputsKey) return;
			lastDispatchedKey.current = inputsKey;

			setLoading(true);

			const flightId = ksuid.generate('flight').toString();
			const resolvedSchemaUrl = await convertRequestToUrl(context, node.info);
			const resolvedHeaders = await Promise.all(
				Object.keys(node.info.headers)
					.filter(key => node.info.headers[key].enabled)
					.map(async key => ({
						key: node.info.headers[key].name,
						value: await parseValueSections(context, node.info.headers[key].value),
					})),
			);

			const graphQlBody: FetcherParams = { query: getIntrospectionQuery() };

			const requestFlight: FlightRequest = {
				body: {
					type: 'text',
					payload: JSON.stringify(graphQlBody),
				},
				// Cap the background schema fetch — without a timeout a hanging
				// endpoint pins the loading screen forever (the request's own
				// `timeoutMs` is independent and not consulted here).
				options: { followRedirects: false, timeoutMs: 15_000 },
				verb: 'post',
				query: {},
				url: [resolvedSchemaUrl.toString()],

				headers: resolvedHeaders.reduce<Record<string, FlightRequestKeyValue>>(
					(acc, val) => {
						acc[val.key] = {
							enabled: true,
							name: val.key,
							value: [val.value],
						};

						return acc;
					},
					{
						'content-type': {
							enabled: true,
							name: 'content-type',
							value: ['application/json'],
						},
					},
				),
			};

			setSchemaFlightId(flightId);
			dispatch(
				requestPureFlight({
					flightId,
					referenceRequestId: node.id,
					request: requestFlight,
					showResult: true,
					reason: 'graphql_schema',
				}),
			);
		},
		800,
		[inputsKey],
	);

	if (!hasSchema && loading) {
		return (
			<Box h='100%'>
				<GraphQlLoading />
			</Box>
		);
	}

	if (schemaFetchError) {
		return (
			<Box h='100%'>
				<GraphQlError error={schemaFetchError} />
			</Box>
		);
	}

	// TODO(afr): Handle updating schema icon(?)

	function updateGraphQlQuery(text: string | undefined) {
		if (!text) return;

		dispatch(
			requestBodyGraphQlEditorQueryChanged({
				requestId: node.id,
				query: text,
			}),
		);

		// TODO(afr): Some sort of debounce on this?
		try {
			const parsedQuery = parse(text);
			const variables = extractVariableNamesFromQuery(parsedQuery);

			if (!variables) return;

			dispatch(
				requestBodyGraphQlEditorReconcileVariables({
					requestId: node.id,
					variables,
				}),
			);
		} catch {
			/* Don't care if this fails */
		}
	}

	return (
		<Box h='100%'>
			<EditorView language={'graphql'} value={body.payload.query} path={operationsUri} onChange={updateGraphQlQuery} />
		</Box>
	);
};

export default GraphQlQueryEditor;
