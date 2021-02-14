import VariableInput from '@beak/app/features/variable-input/components/molecules/VariableInput';
import { actions } from '@beak/app/store/project';
import { NamedNumberEntry, NumberEntry } from '@beak/common/types/beak-json-editor';
import React from 'react';
import { useDispatch } from 'react-redux';

import {
	BodyAction,
	BodyInputValueCell,
	BodyInputWrapper,
	BodyPrimaryCell,
	BodyTypeCell,
} from '../atoms/Cells';
import { Row } from '../atoms/Structure';
import EntryActions from './EntryActions';
import { EntryFolderIrrelevant } from './EntryFolder';
import EntryToggler from './EntryToggler';
import { detectName, JsonEntryProps } from './JsonEntry';
import TypeSelector from './TypeSelector';

interface JsonNumberEntryProps extends JsonEntryProps {
	value: NumberEntry | NamedNumberEntry;
}

const JsonNumberEntry: React.FunctionComponent<JsonNumberEntryProps> = props => {
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
					{nameOverride !== void 0 && nameOverride}
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
					<VariableInput
						parts={props.value.value}
						onChange={parts => dispatch(actions.requestBodyJsonEditorValueChange({
							id,
							requestId,
							value: parts,
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

export default JsonNumberEntry;
