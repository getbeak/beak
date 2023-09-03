import React from 'react';
import { actions } from '@beak/ui/store/project';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import type { RequestBodyGraphQl } from 'packages/types/request';

import JsonEditor from '../../json-editor/components/JsonEditor';

export interface GraphQlVariablesEditorProps {
	node: ValidRequestNode;
}

const GraphQlVariablesEditor: React.FC<GraphQlVariablesEditorProps> = props => {
	const { node } = props;
	const body = node.info.body as RequestBodyGraphQl;

	return (
		<JsonEditor
			requestId={node.id}
			value={body.payload.variables}
			forceRootObject
			editorSelector={state => {
				// Type hell
				const requestNode = state.global.project.tree[node.id] as ValidRequestNode;
				const graphQlBody = requestNode.info.body as RequestBodyGraphQl;

				return graphQlBody.payload.variables;
			}}

			addedEntry={actions.requestBodyGraphQlEditorAddEntry}
			enabledChanged={actions.requestBodyGraphQlEditorEnabledChange}
			removedEntry={actions.requestBodyGraphQlEditorRemoveEntry}
			nameChanged={actions.requestBodyGraphQlEditorNameChange}
			typeChanged={actions.requestBodyGraphQlEditorTypeChange}
			valueChanged={actions.requestBodyGraphQlEditorValueChange}
		/>
	);
};

export default GraphQlVariablesEditor;
