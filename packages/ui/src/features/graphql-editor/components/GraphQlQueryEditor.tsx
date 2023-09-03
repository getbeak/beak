import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import ksuid from '@beak/ksuid';
import EditorView from '@beak/ui/components/atoms/EditorView';
import useDebounce from '@beak/ui/hooks/use-debounce';
import binaryStore from '@beak/ui/lib/binary-store';
import { requestPureFlight } from '@beak/ui/store/flight/actions';
import { FlightRequest, FlightRequestKeyValue } from '@beak/ui/store/flight/types';
import { requestBodyGraphQlEditorQueryChanged, requestBodyGraphQlEditorReconcileVariables } from '@beak/ui/store/project/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { convertRequestToUrl } from '@beak/ui/utils/uri';
import { ValidRequestNode } from '@getbeak/types/nodes';
import { FetcherParams } from '@graphiql/toolkit';
import { getIntrospectionQuery, IntrospectionQuery, parse } from 'graphql';
import { Uri } from 'monaco-editor';
import { initializeMode } from 'monaco-graphql/esm/initializeMode';
import { RequestBodyGraphQl } from 'packages/types/request';
import styled from 'styled-components';

import useRealtimeValueContext from '../../realtime-values/hooks/use-realtime-value-context';
import { parseValueParts } from '../../realtime-values/parser';
import { extractVariableNamesFromQuery } from '../utils';
import GraphQlError from './molecules/GraphQlError';
import GraphQlLoading from './molecules/GraphQlLoading';

export interface GraphQlQueryEditorProps {
	node: ValidRequestNode;
}

const schemaCache: Record<string, IntrospectionQuery> = {};

const GraphQlQueryEditor: React.FC<GraphQlQueryEditorProps> = props => {
	const { node } = props;
	const dispatch = useDispatch();
	const [loading, setLoading] = useState(() => true);
	const [schemaFlightId, setSchemaFlightId] = useState<string>('impossible-yolo');
	const [hasSchema, setHasSchema] = useState(() => Boolean(schemaCache[node.id]));
	const [schemaFetchError, setSchemaFetchError] = useState<Error | null>(null);
	const variableGroups = useAppSelector(s => s.global.variableGroups.variableGroups);
	const selectedGroups = useAppSelector(s => s.global.preferences.editor.selectedVariableGroups);
	const schemaFlight = useAppSelector(s => s.global.flight.flightHistory[node.id]?.history[schemaFlightId]);

	const operationsUri = `${node.id}/operations.graphql`;
	const variablesUri = `${node.id}/variables.json`;
	const schemaUri = `${node.id}/schema.graphql`;

	const body = node.info.body as RequestBodyGraphQl;
	const context = useRealtimeValueContext(node.id);

	// TODO(afr): Also run this when schema _changes_
	useEffect(() => {
		const schema = schemaCache[node.id];

		if (!schema) return;

		initializeMode({
			diagnosticSettings: {
				validateVariablesJSON: {
					[Uri.file(operationsUri).toString()]: [
						Uri.file(variablesUri).toString(),
					],
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
			schemas: [{
				introspectionJSON: schema,
				uri: schemaUri,
			}],
		});
	}, [node.id, setSchemaFetchError, hasSchema]);

	useEffect(() => {
		if (!schemaFlight) return;

		const textDecoder = new TextDecoder();
		const binaryData = binaryStore.get(schemaFlight.binaryStoreKey) ?? [];
		const decodedText = textDecoder.decode(binaryData);

		if (schemaFlight.error || !schemaFlight.response || !schemaFlight.response.hasBody || !decodedText) {
			setSchemaFetchError(schemaFlight.error!);
			setHasSchema(false);

			return;
		}

		// TODO(afr): Validating this would be a good idea
		const jsonResponse = JSON.parse(decodedText);

		schemaCache[node.id] = jsonResponse.data as unknown as IntrospectionQuery;
		setSchemaFetchError(null);
		setHasSchema(true);
	}, [schemaFlight?.flightId]);

	useDebounce(async () => {
		setLoading(true);

		const flightId = ksuid.generate('flight').toString();
		const resolvedSchemaUrl = await convertRequestToUrl(context, node.info);
		const resolvedHeaders = await Promise.all(Object.keys(node.info.headers)
			.filter(key => node.info.headers[key].enabled)
			.map(async key => ({
				key: node.info.headers[key].name,
				value: await parseValueParts(context, node.info.headers[key].value),
			})));

		const graphQlBody: FetcherParams = { query: getIntrospectionQuery() };

		const requestFlight: FlightRequest = {
			body: {
				type: 'text',
				payload: JSON.stringify(graphQlBody),
			},
			options: { followRedirects: false },
			verb: 'post',
			query: {},
			url: [resolvedSchemaUrl.toString()],

			headers: resolvedHeaders.reduce<Record<string, FlightRequestKeyValue>>((acc, val) => {
				// eslint-disable-next-line no-param-reassign
				acc[val.key] = {
					enabled: true,
					name: val.key,
					value: [val.value],
				};

				return acc;
			}, {
				'content-type': {
					enabled: true,
					name: 'content-type',
					value: ['application/json'],
				},
			}),
		};

		setSchemaFlightId(flightId);
		dispatch(requestPureFlight({
			flightId,
			referenceRequestId: node.id,
			request: requestFlight,
			showResult: true,
			reason: 'graphql_schema',
		}));
	}, 500, [
		// This is messy but it is what it is
		node.info.verb,
		node.info.url,
		JSON.stringify(node.info.query),
		JSON.stringify(variableGroups),
		JSON.stringify(selectedGroups),
	]);

	if (!hasSchema && loading) {
		return (
			<Container>
				<GraphQlLoading />
			</Container>
		);
	}

	if (schemaFetchError) {
		return (
			<Container>
				<GraphQlError error={schemaFetchError} />
			</Container>
		);
	}

	// TODO(afr): Handle updating schema icon(?)

	function updateGraphQlQuery(text: string | undefined) {
		if (!text) return;

		dispatch(requestBodyGraphQlEditorQueryChanged({
			requestId: node.id,
			query: text,
		}));

		// TODO(afr): Some sort of debounce on this?
		try {
			const parsedQuery = parse(text);
			const variables = extractVariableNamesFromQuery(parsedQuery);

			if (!variables) return;

			dispatch(requestBodyGraphQlEditorReconcileVariables({
				requestId: node.id,
				variables,
			}));
		} catch { /* Don't care if this fails */ }
	}

	return (
		<Container>
			<EditorView
				language={'graphql'}
				value={body.payload.query}
				path={operationsUri}
				onChange={updateGraphQlQuery}
			/>
		</Container>
	);
};

const Container = styled.div`
	height: 100%;
`;

export default GraphQlQueryEditor;
