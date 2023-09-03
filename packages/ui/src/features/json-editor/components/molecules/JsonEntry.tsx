import React from 'react';
import type { Entries, NamedEntries } from '@getbeak/types/body-editor-json';

import JsonArrayEntry from './JsonArrayEntry';
import JsonBooleanEntry from './JsonBooleanEntry';
import JsonNullEntry from './JsonNullEntry';
import JsonNumberEntry from './JsonNumberEntry';
import JsonObjectEntry from './JsonObjectEntry';
import JsonStringEntry from './JsonStringEntry';

export interface JsonEntryProps {
	depth: number;
	requestId: string;
	value: Entries;

	forceRootObject?: boolean;
	nameOverride?: string;
}

export const JsonEntry: React.FC<React.PropsWithChildren<JsonEntryProps>> = props => {
	const { depth, requestId, value, nameOverride, forceRootObject } = props;

	switch (value.type) {
		case 'string':
			return <JsonStringEntry depth={depth} requestId={requestId} value={value} nameOverride={nameOverride} />;
		case 'number':
			return <JsonNumberEntry depth={depth} requestId={requestId} value={value} nameOverride={nameOverride} />;
		case 'boolean':
			return <JsonBooleanEntry depth={depth} requestId={requestId} value={value} nameOverride={nameOverride} />;
		case 'null':
			return <JsonNullEntry depth={depth} requestId={requestId} value={value} nameOverride={nameOverride} />;

		case 'array':
			return <JsonArrayEntry depth={depth} requestId={requestId} value={value} nameOverride={nameOverride} />;
		case 'object': {
			return (
				<JsonObjectEntry
					depth={depth}
					requestId={requestId}
					value={value}
					forceRootObject={forceRootObject}
					nameOverride={nameOverride}
				/>
			);
		}

		default:
			return null;
	}
};

export function detectName(depth: number, entry: Entries) {
	if (depth === 0)
		return '<Root>';

	if ((entry as NamedEntries).name !== void 0)
		return (entry as NamedEntries).name;

	return '';
}
