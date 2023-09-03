import { TabSubItem } from '@beak/ui/components/atoms/TabItem';
import {
	ASTNode,
	DocumentNode,
	Kind,
	NamedTypeNode,
	NameNode,
	NonNullTypeNode,
	OperationDefinitionNode,
} from 'graphql';
import { EntryType } from 'packages/types/body-editor-json';

import { EditorMode, ExtractedVariables } from './types';

export const editorTabSubItems: TabSubItem<EditorMode>[] = [{
	key: 'query',
	label: 'Query',
}, {
	key: 'variables',
	label: 'Variables',
}];

export function extractVariableNamesFromQuery(document: DocumentNode): ExtractedVariables | null {
	if (document.kind !== 'Document') return null;

	/* eslint-disable @typescript-eslint/indent */
	/* eslint-disable no-param-reassign */
	return document.definitions
		.filter(d => d.kind === Kind.OPERATION_DEFINITION)
		.map(d => d as OperationDefinitionNode)
		.map(d => d.variableDefinitions)
		.flat(1)
		.reduce<ExtractedVariables>((acc, val) => {
			if (!val) return acc;

			const name = val.variable.name.value;

			acc[name] = detectKnownJsonType(val.type);

			return acc;
		}, {});
	/* eslint-enable @typescript-eslint/indent */
	/* eslint-enable no-param-reassign */
}

function detectKnownJsonType(node: ASTNode): EntryType {
	switch (node.kind) {
		case Kind.NAME:
			return nameNodeToKnownJsonType(node);

		case Kind.LIST_TYPE:
			return 'array';

		case Kind.NON_NULL_TYPE:
			return detectKnownJsonType((node as NonNullTypeNode).type);

		case Kind.NAMED_TYPE:
			return detectKnownJsonType((node as NamedTypeNode).name);

		default: return 'string';
	}
}

function nameNodeToKnownJsonType(node: NameNode): EntryType {
	switch (node.value) {
		case 'Float':
		case 'Int':
			return 'number';

		case 'Boolean':
			return 'boolean';

		default: return 'string';
	}
}
