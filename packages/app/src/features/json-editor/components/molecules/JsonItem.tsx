import RequestPreferencesContext from '@beak/app/features/request-pane/contexts/request-preferences-context';
import VariableInput from '@beak/app/features/variable-input/components/molecules/VariableInput';
import { actions } from '@beak/app/store/project';
import {
	Entries,
	NamedEntries,
	NamedNumberEntry,
	NamedObjectEntry,
	NamedStringEntry,
	NumberEntry,
	ObjectEntry,
	StringEntry,
} from '@beak/common/types/beak-json-editor';
import React, { useContext, useState } from 'react';
import { useDispatch } from 'react-redux';

import {
	BodyAction,
	BodyInputValueCell,
	BodyInputWrapper,
	BodyLabelValueCell,
	BodyPrimaryCell,
	BodyTypeCell,
} from '../atoms/Cells';
import { Row } from '../atoms/Structure';
import EntryFolder, { ExtryFolderIrrelevant } from './EntryFolder';
import EntryToggler from './EntryToggler';
import TypeSelector from './TypeSelector';

interface JsonItemEntryProps {
	depth: number;
	jPath: string;
	requestId: string;
	value: Entries;
}

export const JsonItemEntry: React.FunctionComponent<JsonItemEntryProps> = props => {
	const { depth, jPath, requestId, value } = props;

	switch (value.type) {
		case 'string':
			return <JsonStringEntry depth={depth} jPath={jPath} requestId={requestId} value={value} />;

		case 'number':
			return <JsonNumberEntry depth={depth} jPath={jPath} requestId={requestId} value={value} />;

		// case 'boolean':
		// case 'null':

		// case 'array':

		case 'object':
			return <JsonObjectEntry depth={depth} jPath={jPath} requestId={requestId} value={value} />;

		default:
			return null;
	}
};

interface JsonStringEntryProps extends JsonItemEntryProps {
	value: StringEntry | NamedStringEntry;
}

const JsonStringEntry: React.FunctionComponent<JsonStringEntryProps> = props => {
	const { depth, jPath, requestId, value } = props;
	const dispatch = useDispatch();

	return (
		<Row>
			<BodyPrimaryCell depth={depth}>
				<ExtryFolderIrrelevant />
				<EntryToggler
					jPath={[jPath, '[enabled]'].join('.')}
					requestId={requestId}
					value={value.enabled}
				/>
				<BodyInputWrapper>
					<input
						disabled={depth === 0}
						type={'text'}
						value={detectName(depth, value)}
						onChange={e => dispatch(actions.requestBodyJsonEditorNameChange({
							requestId,
							name: e.target.value,
							jPath: [jPath, '[name]'].join('.'),
						}))}
					/>
				</BodyInputWrapper>
			</BodyPrimaryCell>
			<BodyTypeCell>
				<TypeSelector
					requestId={requestId}
					jPath={jPath}
					value={value.type}
				/>
			</BodyTypeCell>
			<BodyInputValueCell>
				<BodyInputWrapper>
					<VariableInput
						parts={props.value.value}
						onChange={parts => dispatch(actions.requestBodyJsonEditorValueChange({
							requestId,
							value: parts,
							jPath: [jPath, '[value]'].join('.'),
						}))}
					/>
				</BodyInputWrapper>
			</BodyInputValueCell>
			<BodyAction />
		</Row>
	);
};

interface JsonNumberEntryProps extends JsonItemEntryProps {
	value: NumberEntry | NamedNumberEntry;
}

const JsonNumberEntry: React.FunctionComponent<JsonNumberEntryProps> = props => {
	const { depth, jPath, requestId, value } = props;
	const dispatch = useDispatch();

	return (
		<Row>
			<BodyPrimaryCell depth={depth}>
				<ExtryFolderIrrelevant />
				<EntryToggler
					jPath={[jPath, '[enabled]'].join('.')}
					requestId={requestId}
					value={value.enabled}
				/>
				<BodyInputWrapper>
					<input
						disabled={depth === 0}
						type={'text'}
						value={detectName(depth, value)}
						onChange={e => dispatch(actions.requestBodyJsonEditorNameChange({
							requestId,
							name: e.target.value,
							jPath: [jPath, '[name]'].join('.'),
						}))}
					/>
				</BodyInputWrapper>
			</BodyPrimaryCell>
			<BodyTypeCell>
				<TypeSelector
					requestId={requestId}
					jPath={jPath}
					value={value.type}
				/>
			</BodyTypeCell>
			<BodyInputValueCell>
				<BodyInputWrapper>
					<VariableInput
						parts={props.value.value}
						onChange={parts => dispatch(actions.requestBodyJsonEditorValueChange({
							requestId,
							value: parts,
							jPath: [jPath, '[value]'].join('.'),
						}))}
					/>
				</BodyInputWrapper>
			</BodyInputValueCell>
			<BodyAction />
		</Row>
	);
};

interface JsonObjectEntryProps extends JsonItemEntryProps {
	value: ObjectEntry | NamedObjectEntry;
}

const JsonObjectEntry: React.FunctionComponent<JsonObjectEntryProps> = props => {
	const { depth, jPath, requestId, value } = props;
	const reqPref = useContext(RequestPreferencesContext);
	const [expanded, setExpanded] = useState(reqPref!.getPreferences().jsonEditor?.expands[jPath]);
	const dispatch = useDispatch();
	const children = value.value;

	return (
		<React.Fragment>
			<Row>
				<BodyPrimaryCell depth={depth}>
					<EntryFolder
						jPath={jPath}
						expanded={expanded}
						requestId={requestId}
						onChange={expanded => setExpanded(expanded)}
					/>
					<EntryToggler
						jPath={[jPath, '[enabled]'].join('.')}
						requestId={requestId}
						value={value.enabled}
					/>
					<BodyInputWrapper>
						<input
							disabled={depth === 0}
							type={'text'}
							value={detectName(depth, value)}
							onChange={e => dispatch(actions.requestBodyJsonEditorNameChange({
								requestId,
								name: e.target.value,
								jPath,
							}))}
						/>
					</BodyInputWrapper>
				</BodyPrimaryCell>
				<BodyTypeCell>
					<TypeSelector
						requestId={requestId}
						jPath={jPath}
						value={value.type}
					/>
				</BodyTypeCell>
				<BodyLabelValueCell>
					{`${children.length} ${children.length === 1 ? 'key' : 'keys'}`}
				</BodyLabelValueCell>
				<BodyAction />
			</Row>
			{expanded && children.map((c, i) => (
				<JsonItemEntry
					depth={depth + 1}
					jPath={[jPath, '[value]', `[${i}]`].join('.')}
					key={i}
					requestId={requestId}
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
