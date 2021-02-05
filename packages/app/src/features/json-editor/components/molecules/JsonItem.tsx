import { Entries, NamedEntries } from '@beak/common/types/beak-json-editor';
import React from 'react';

import JsonArrayEntry from './JsonArrayEntry';
import JsonBooleanEntry from './JsonBooleanEntry';
import JsonNullEntry from './JsonNullEntry';
import JsonNumberEntry from './JsonNumberEntry';
import JsonObjectEntry from './JsonObjectEntry';
import JsonStringEntry from './JsonStringEntry';

export interface JsonItemEntryProps {
	depth: number;
	jPath: string;
	requestId: string;
	value: Entries;

	arrayIndex?: number;
}

export const JsonItemEntry: React.FunctionComponent<JsonItemEntryProps> = props => {
	const { depth, jPath, requestId, value, arrayIndex } = props;

	switch (value.type) {
		case 'string':
			return (
				<JsonStringEntry
					depth={depth}
					jPath={jPath}
					requestId={requestId}
					value={value}
					arrayIndex={arrayIndex}
				/>
			);

		case 'number':
			return (
				<JsonNumberEntry
					depth={depth}
					jPath={jPath}
					requestId={requestId}
					value={value}
					arrayIndex={arrayIndex}
				/>
			);

		case 'boolean':
			return (
				<JsonBooleanEntry
					depth={depth}
					jPath={jPath}
					requestId={requestId}
					value={value}
					arrayIndex={arrayIndex}
				/>
			);

		case 'null':
			return (
				<JsonNullEntry
					depth={depth}
					jPath={jPath}
					requestId={requestId}
					value={value}
					arrayIndex={arrayIndex}
				/>
			);

		case 'array':
			return (
				<JsonArrayEntry
					depth={depth}
					jPath={jPath}
					requestId={requestId}
					value={value}
					arrayIndex={arrayIndex}
				/>
			);

		case 'object':
			return (
				<JsonObjectEntry
					depth={depth}
					jPath={jPath}
					requestId={requestId}
					value={value}
					arrayIndex={arrayIndex}
				/>
			);

		default:
			return null;
	}
};

export function detectName(depth: number, entry: Entries) {
	if (depth === 0)
		return '<Root value>';

	if ((entry as NamedEntries).name !== void 0)
		return (entry as NamedEntries).name;

	return '<Unknown>';
}
