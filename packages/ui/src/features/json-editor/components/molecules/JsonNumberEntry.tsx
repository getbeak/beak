import React, { useContext } from 'react';
import { useDispatch } from 'react-redux';
import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import VariableInput from '@beak/ui/features/variable-input/components/VariableInput';
import type { NamedNumberEntry, NumberEntry } from '@getbeak/types/body-editor-json';

import { JsonEditorContext } from '../../contexts/json-editor-context';
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

interface JsonNumberEntryProps extends JsonEntryProps {
	value: NumberEntry | NamedNumberEntry;
}

const JsonNumberEntry: React.FC<React.PropsWithChildren<JsonNumberEntryProps>> = props => {
	const { depth, requestId, value, nameOverride } = props;
	const { id } = value;
	const dispatch = useDispatch();

	const editorContext = useContext(JsonEditorContext)!;

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
						<DebouncedInput
							disabled={depth === 0}
							type={'text'}
							value={detectName(depth, value)}
							onChange={name => dispatch(editorContext.nameChange({
								id,
								requestId,
								name,
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
					<VariableInput
						requestId={props.requestId}
						parts={props.value.value}
						onChange={parts => dispatch(editorContext.valueChange({
							id,
							requestId,
							value: parts,
						}))}
					/>
				</BodyInputWrapper>
			</BodyInputValueCell>
			<BodyAction>
				<EntryActions id={id} entry={value} requestId={requestId} />
			</BodyAction>
		</Row>
	);
};

export default JsonNumberEntry;
