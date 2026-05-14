import React from 'react';
import { useDispatch } from 'react-redux';
import EditorView from '@beak/ui/components/atoms/EditorView';
import BasicTableEditor from '@beak/ui/features/basic-table-editor/components/BasicTableEditor';
import GraphQlQueryEditor from '@beak/ui/features/graphql-editor/components/GraphQlQueryEditor';
import GraphQlVariablesEditor from '@beak/ui/features/graphql-editor/components/GraphQlVariablesEditor';
import type { EditorMode } from '@beak/ui/features/graphql-editor/types';
import JsonEditor from '@beak/ui/features/json-editor/components/JsonEditor';
import type { ValueSections } from '@beak/ui/features/variables/values';
import actions, { requestBodyTextChanged } from '@beak/ui/store/project/actions';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import type { RequestBodyJson } from '@getbeak/types/request';

import { Box } from '@chakra-ui/react';
import FileUploadView from '../molecules/FileUploadView';

export interface BodyTabProps {
	node: ValidRequestNode;
	graphQlMode: EditorMode;
}

const BodyTab: React.FC<React.PropsWithChildren<BodyTabProps>> = props => {
	const dispatch = useDispatch();
	const { node, graphQlMode } = props;
	const { body } = node.info;

	return (
		<Box h='100%' overflowY={body.type !== 'text' ? 'auto' : 'hidden'}>
			{body.type === 'text' && (
				<EditorView
					language={'text'}
					value={body.payload}
					onChange={text => dispatch(requestBodyTextChanged({ requestId: node.id, text: text ?? '' }))}
				/>
			)}
			{body.type === 'json' && (
				<JsonEditor
					requestId={node.id}
					value={body.payload}
					editorSelector={state => {
						const requestNode = state.global.project.tree[node.id] as ValidRequestNode;
						const jsonBody = requestNode.info.body as RequestBodyJson;

						return jsonBody.payload;
					}}
				/>
			)}
			{body.type === 'url_encoded_form' && (
				<BasicTableEditor
					items={body.payload}
					requestId={node.id}
					addItem={() => dispatch(actions.requestBodyUrlEncodedEditorAddItem({ requestId: node.id }))}
					removeItem={id => dispatch(actions.requestBodyUrlEncodedEditorRemoveItem({
						requestId: node.id,
						id,
					}))}
					updateItem={(type, id, value) => {
						if (type === 'name') {
							dispatch(actions.requestBodyUrlEncodedEditorNameChange({
								requestId: node.id,
								id,
								name: value as string,
							}));
						} else if (type === 'enabled') {
							dispatch(actions.requestBodyUrlEncodedEditorEnabledChange({
								requestId: node.id,
								id,
								enabled: value as boolean,
							}));
						} else if (type === 'value') {
							dispatch(actions.requestBodyUrlEncodedEditorValueChange({
								requestId: node.id,
								id,
								value: value as ValueSections,
							}));
						}
					}}
				/>
			)}
			{body.type === 'graphql' && graphQlMode === 'query' && <GraphQlQueryEditor node={node} />}
			{body.type === 'graphql' && graphQlMode === 'variables' && <GraphQlVariablesEditor node={node} />}
			{body.type === 'file' && <FileUploadView node={node} />}
		</Box>
	);
};

export default BodyTab;
