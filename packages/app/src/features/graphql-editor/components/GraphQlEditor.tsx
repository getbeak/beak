import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import EditorView from '@beak/app/components/atoms/EditorView';
import useComponentMounted from '@beak/app/hooks/use-component-mounted';
import useDebounce from '@beak/app/hooks/use-debounce';
import { requestBodyGraphQlEditorQueryChanged } from '@beak/app/store/project/actions';
import { useAppSelector } from '@beak/app/store/redux';
import { convertRequestToUrl } from '@beak/app/utils/uri';
import Squawk from '@beak/common/utils/squawk';
import { ValidRequestNode } from '@getbeak/types/nodes';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { getIntrospectionQuery, IntrospectionQuery } from 'graphql';
import { Uri } from 'monaco-editor';
import { initializeMode } from 'monaco-graphql/src/initializeMode';
import { RequestBodyGraphQl } from 'packages/types/request';
import styled from 'styled-components';

import useRealtimeValueContext from '../../realtime-values/hooks/use-realtime-value-context';
import { parseValueParts } from '../../realtime-values/parser';
import GraphQlError from './molecules/GraphQlError';

export interface GraphQlEditorProps {
	node: ValidRequestNode;
}

const GraphQlEditor: React.FC<GraphQlEditorProps> = props => {
	const { node } = props;
	const dispatch = useDispatch();
	const mounted = useComponentMounted();
	const [loading, setLoading] = useState(() => true);
	const [schemaFetchError, setSchemaFetchError] = useState<Error | null>(null);
	const variableGroups = useAppSelector(s => s.global.variableGroups.variableGroups);
	const selectedGroups = useAppSelector(s => s.global.preferences.editor.selectedVariableGroups);

	const operationsUri = `${node.id}/operations.graphql`;
	const variablesUri = `${node.id}/variables.json`;
	const schemaUri = `${node.id}/schema.graphql`;

	const body = node.info.body as RequestBodyGraphQl;
	const context = useRealtimeValueContext(node.id);

	useDebounce(async () => {
		if (!mounted) return;

		setLoading(true);

		try {
			const resolvedSchemaUrl = await convertRequestToUrl(context, node.info);
			const schemaUrl = resolvedSchemaUrl.toString();

			const resolvedHeaders = await Promise.all(Object.keys(node.info.headers)
				.filter(key => node.info.headers[key].enabled)
				.map(async key => ({
					key: node.info.headers[key].name,
					value: await parseValueParts(context, node.info.headers[key].value),
				})));

			const schemaFetcher = createGraphiQLFetcher({
				url: schemaUrl,
				headers: resolvedHeaders.reduce<Record<string, string>>((acc, val) => {
					// eslint-disable-next-line no-param-reassign
					acc[val.key] = val.value;

					return acc;
				}, {}),
			});

			const schema = await schemaFetcher({
				query: getIntrospectionQuery(),
				operationName: 'IntrospectionQuery',
			});

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
					introspectionJSON: schema.data as unknown as IntrospectionQuery,
					uri: schemaUri,
				}],
			});

			setSchemaFetchError(null);
		} catch (error) {
			setSchemaFetchError(error as Error);
		} finally {
			setLoading(false);
		}
	}, 500, [
		// This is messy but it is what it is
		node.info.verb,
		node.info.url,
		JSON.stringify(node.info.query),
		JSON.stringify(variableGroups),
		JSON.stringify(selectedGroups),
	]);

	// TODO(afr): Handle loading state from initial schema fetch
	if (loading)
		return <>{'Loading...'}</>;

	if (schemaFetchError) {
		return (
			<Container>
				<GraphQlError error={schemaFetchError} />
			</Container>
		);
	}

	// TODO(afr): Handle updating schema icon(?)

	return (
		<Container>
			<EditorView
				language={'graphql'}
				value={body.payload.query}
				path={operationsUri}
				onChange={text => dispatch(requestBodyGraphQlEditorQueryChanged({
					requestId: node.id,
					query: text ?? '',
				}))}
			/>
		</Container>
	);
};

const Container = styled.div`
	height: 100%;
`;

export default GraphQlEditor;
