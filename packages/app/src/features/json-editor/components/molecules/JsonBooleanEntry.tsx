import { actions } from '@beak/app/store/project';
import { BooleanEntry, NamedBooleanEntry } from '@beak/common/types/beak-json-editor';
import React from 'react';
import { useDispatch } from 'react-redux';

import {
	BodyAction,
	BodyInputValueCell,
	BodyInputWrapper,
	BodyNameOverrideWrapper,
	BodyPrimaryCell,
	BodyTypeCell,
} from '../atoms/Cells';
import { Row } from '../atoms/Structure';
import EntryActions from './EntryActions';
import { EntryFolderIrrelevant } from './EntryFolder';
import EntryToggler from './EntryToggler';
import { detectName, JsonEntryProps } from './JsonEntry';
import TypeSelector from './TypeSelector';

interface JsonBooleanEntryProps extends JsonEntryProps {
	value: BooleanEntry | NamedBooleanEntry;
}

const JsonBooleanEntry: React.FunctionComponent<JsonBooleanEntryProps> = props => {
	const { depth, requestId, value, nameOverride } = props;
	const { id, parentId } = value;
	const dispatch = useDispatch();

	return (
		<Row>
			<BodyPrimaryCell depth={depth}>
				<EntryFolderIrrelevant />
				<EntryToggler
					id={id}
					requestId={requestId}
					value={value.enabled}
				/>
				<BodyInputWrapper>
					{nameOverride === void 0 && (
						<input
							disabled={depth === 0}
							type={'text'}
							value={detectName(depth, value)}
							onChange={e => dispatch(actions.requestBodyJsonEditorNameChange({
								id,
								requestId,
								name: e.target.value,
							}))}
						/>
					)}
					{nameOverride !== void 0 && (
						<BodyNameOverrideWrapper>{nameOverride}</BodyNameOverrideWrapper>
					)}
				</BodyInputWrapper>
			</BodyPrimaryCell>
			<BodyTypeCell>
				<TypeSelector
					requestId={requestId}
					id={id}
					value={value.type}
				/>
			</BodyTypeCell>
			<BodyInputValueCell>
				<BodyInputWrapper>
					<input
						type={'checkbox'}
						checked={value.value}
						onChange={e => dispatch(actions.requestBodyJsonEditorValueChange({
							id,
							requestId,
							value: e.target.checked,
						}))}
					/>
				</BodyInputWrapper>
			</BodyInputValueCell>
			<BodyAction>
				<EntryActions id={id} isRoot={parentId === null} requestId={requestId} />
			</BodyAction>
		</Row>
	);
};

export default JsonBooleanEntry;
