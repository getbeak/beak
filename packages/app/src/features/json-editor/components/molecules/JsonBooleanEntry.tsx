import React, { useContext } from 'react';
import { useDispatch } from 'react-redux';
import DebouncedInput from '@beak/app/components/atoms/DebouncedInput';
import type { BooleanEntry, NamedBooleanEntry } from '@getbeak/types/body-editor-json';

import { JsonEditorAbstractionsContext } from '../../contexts/json-editor-context';
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

const JsonBooleanEntry: React.FC<React.PropsWithChildren<JsonBooleanEntryProps>> = props => {
	const { depth, requestId, value, nameOverride } = props;
	const { id } = value;
	const dispatch = useDispatch();

	const abstractionContext = useContext(JsonEditorAbstractionsContext)!;

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
							onChange={name => dispatch(abstractionContext.requestBodyJsonEditorNameChange({
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
					<input
						type={'checkbox'}
						checked={value.value}
						onChange={e => dispatch(abstractionContext.requestBodyJsonEditorValueChange({
							id,
							requestId,
							value: e.target.checked,
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

export default JsonBooleanEntry;
