import VariableInput from '@beak/app/features/variable-input/components/molecules/VariableInput';
import {
	Entries,
	NamedEntries,
	NamedObjectEntry,
	NamedStringEntry,
	ObjectEntry,
	StringEntry,
} from '@beak/common/types/beak-json-editor';
import React from 'react';

import {
	BodyAction,
	BodyInputValueCell,
	BodyLabelValueCell,
	BodyPrimaryCell,
	BodyTypeCell,
} from '../atoms/Cells';
import { Row } from '../atoms/Structure';
import TypeSelector from './TypeSelector';

interface JsonItemEntryProps {
	depth: number;
	jPath?: string;
	value: Entries;
}

export const JsonItemEntry: React.FunctionComponent<JsonItemEntryProps> = props => {
	const { depth, jPath, value } = props;

	switch (value.type) {
		case 'string':
			return <JsonStringEntry depth={depth} jPath={jPath} value={value} />;

		// case 'number':
		// case 'boolean':
		// case 'null':
		// case 'array':
		case 'object':
			return <JsonObjectEntry depth={depth} jPath={jPath} value={value} />;

		default:
			return null;
	}
};

interface JsonStringEntryProps extends JsonItemEntryProps {
	value: StringEntry | NamedStringEntry;
}

const JsonStringEntry: React.FunctionComponent<JsonStringEntryProps> = props => {
	const { depth, value } = props;

	return (
		<Row>
			<BodyPrimaryCell depth={depth}>
				{/* Fold */}
				{/* Toggle */}
				<input disabled value={detectName(depth, value)} />
			</BodyPrimaryCell>
			<BodyTypeCell>
				<TypeSelector />
			</BodyTypeCell>
			<BodyInputValueCell>
				<VariableInput
					parts={props.value.value}
					onChange={() => { /* Update value with jPath */ }}
				/>
			</BodyInputValueCell>
			<BodyAction />
		</Row>
	);
};

interface JsonObjectEntryProps extends JsonItemEntryProps {
	value: ObjectEntry | NamedObjectEntry;
}

const JsonObjectEntry: React.FunctionComponent<JsonObjectEntryProps> = props => {
	const { depth, value } = props;
	const children = value.value;

	return (
		<React.Fragment>
			<Row>
				<BodyPrimaryCell depth={depth}>
					{/* Fold */}
					{/* Toggle */}
					<input disabled value={detectName(depth, value)} />
				</BodyPrimaryCell>
				<BodyTypeCell>
					<TypeSelector />
				</BodyTypeCell>
				<BodyLabelValueCell>
					{`${children.length} ${children.length === 1 ? 'keys' : 'keys'}`}
				</BodyLabelValueCell>
				<BodyAction />
			</Row>
			{children.map(c => (
				<JsonItemEntry
					depth={depth + 1}
					jPath={''}
					value={c}
				/>
			))}
		</React.Fragment>
	);
};

function detectName(depth: number, entry: Entries) {
	if (depth === 0)
		return '<Root value>';

	if ((entry as NamedEntries).name !== void 0)
		return (entry as NamedEntries).name;

	return '<Unknown>';
}
