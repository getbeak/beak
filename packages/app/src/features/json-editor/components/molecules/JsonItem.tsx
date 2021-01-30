import VariableInput from '@beak/app/features/variable-input/components/molecules/VariableInput';
import { Entries, NamedEntries, NamedStringEntry, StringEntry } from '@beak/common/types/beak-json-editor';
import React from 'react';

import {
	BodyAction,
	BodyFoldCell,
	BodyInputValueCell,
	BodyKeyCell,
	BodyToggleCell,
	BodyTypeCell,
} from '../atoms/Cells';
import { Row } from '../atoms/Structure';
import TypeSelector from './TypeSelector';

interface JsonItemEntryProps {
	isRoot?: boolean;
	jPath?: string;
	value: Entries;
}

export const JsonItemEntry: React.FunctionComponent<JsonItemEntryProps> = props => {
	const { isRoot, jPath, value } = props;

	switch (value.type) {
		case 'string':
			return <JsonStringEntry isRoot={isRoot} jPath={jPath} value={value} />;

		// case 'number':
		// case 'boolean':
		// case 'null':
		// case 'array':
		// case 'object':

		default:
			return null;
	}
};

interface JsonStringEntryProps extends JsonItemEntryProps {
	value: StringEntry | NamedStringEntry;
}

const JsonStringEntry: React.FunctionComponent<JsonStringEntryProps> = props => {
	const { isRoot, jPath, value } = props;

	return (
		<Row>
			<BodyFoldCell />
			<BodyToggleCell />
			<BodyTypeCell>
				<TypeSelector />
			</BodyTypeCell>
			<BodyKeyCell>
				<input disabled value={detectName(isRoot, value)} />
			</BodyKeyCell>
			<BodyInputValueCell>
				<VariableInput
					parts={props.value.value}
					onChange={() => { }}
				/>
			</BodyInputValueCell>
			<BodyAction />
		</Row>
	);
};

function detectName(isRoot: boolean | undefined, entry: Entries) {
	if (isRoot)
		return '<Root value>';

	if ((entry as NamedEntries).name !== void 0)
		return (entry as NamedEntries).name;

	return '<Unknown>';
}
