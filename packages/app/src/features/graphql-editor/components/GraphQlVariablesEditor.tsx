import React from 'react';
import { actions } from '@beak/app/store/project';
import { ValidRequestNode } from '@getbeak/types/nodes';
import { RequestBodyGraphQl } from 'packages/types/request';
import styled from 'styled-components';

import JsonEditor from '../../json-editor/components/JsonEditor';

export interface GraphQlVariablesEditorProps {
	node: ValidRequestNode;
}

const GraphQlVariablesEditor: React.FC<GraphQlVariablesEditorProps> = props => {
	const { node } = props;
	const body = node.info.body as RequestBodyGraphQl;

	return (
		<Container>
			<JsonEditor
				requestId={node.id}
				value={body.payload.variables}

				jsonEditorAddedEntry={actions.requestBodyGraphQlEditorAddEntry}
				jsonEditorEnabledChanged={actions.requestBodyGraphQlEditorEnabledChange}
				jsonEditorRemovedEntry={actions.requestBodyGraphQlEditorRemoveEntry}
				jsonEditorNameChanged={actions.requestBodyGraphQlEditorNameChange}
				jsonEditorTypeChanged={actions.requestBodyGraphQlEditorTypeChange}
				jsonEditorValueChanged={actions.requestBodyGraphQlEditorValueChange}
			/>
		</Container>
	);
};

const Container = styled.div`
	height: 100%;
`;

export default GraphQlVariablesEditor;
