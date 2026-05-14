import type { TabSubItem } from '@beak/ui/components/atoms/TabItem';
import type { EntryType } from '@getbeak/types/body-editor-json';
import {
	type ASTNode,
	type DocumentNode,
	Kind,
	type NamedTypeNode,
	type NameNode,
	type NonNullTypeNode,
	type OperationDefinitionNode,
} from 'graphql';

import type { EditorMode, ExtractedVariables } from './types';

export const editorTabSubItems: TabSubItem<EditorMode>[] = [
	{
		key: 'query',
		label: 'Query',
	},
	{
		key: 'variables',
		label: 'Variables',
	},
];

export function extractVariableNamesFromQuery(document: DocumentNode): ExtractedVariables | null {
	if (document.kind !== 'Document') return null;

	return document.definitions
		.filter(d => d.kind === Kind.OPERATION_DEFINITION)
		.map(d => d as OperationDefinitionNode)
		.flatMap(d => d.variableDefinitions)
		.reduce<ExtractedVariables>((acc, val) => {
			if (!val) return acc;

			const name = val.variable.name.value;

			acc[name] = detectKnownJsonType(val.type);

			return acc;
		}, {});
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

		default:
			return 'string';
	}
}

function nameNodeToKnownJsonType(node: NameNode): EntryType {
	switch (node.value) {
		case 'Float':
		case 'Int':
			return 'number';

		case 'Boolean':
			return 'boolean';

		default:
			return 'string';
	}
}
