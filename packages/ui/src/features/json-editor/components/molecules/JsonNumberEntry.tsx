import VariableInput from '@beak/ui/features/variable-input/components/VariableInput';
import type { EntryType, NamedNumberEntry, NumberEntry } from '@getbeak/types/body-editor-json';
import React, { useContext } from 'react';
import { useDispatch } from 'react-redux';

import { JsonEditorContext } from '../../contexts/json-editor-context';
import { BodyInputWrapper } from '../atoms/Cells';
import EntryActions from './EntryActions';
import EntryPrimary from './EntryPrimary';
import EntryRow from './EntryRow';
import EntryToggler from './EntryToggler';
import type { JsonEntryProps } from './JsonEntry';
import TypeSelector from './TypeSelector';

interface JsonNumberEntryProps extends JsonEntryProps {
	value: NumberEntry | NamedNumberEntry;
}

const ROOT_CONTAINER_TYPES: EntryType[] = ['object', 'array'];

const JsonNumberEntry: React.FC<React.PropsWithChildren<JsonNumberEntryProps>> = props => {
	const { depth, requestId, value, nameOverride } = props;
	const { id } = value;
	const dispatch = useDispatch();

	const editorContext = useContext(JsonEditorContext)!;
	const isRoot = depth === 0;

	return (
		<EntryRow
			id={id}
			depth={depth}
			parentId={value.parentId}
			canDrag={!isRoot}
			toggle={<EntryToggler id={id} requestId={requestId} value={value.enabled} />}
			primary={<EntryPrimary depth={depth} requestId={requestId} value={value} nameOverride={nameOverride} />}
			type={
				<TypeSelector
					allowedTypes={isRoot ? ROOT_CONTAINER_TYPES : void 0}
					requestId={requestId}
					id={id}
					value={value.type}
				/>
			}
			value={
				<BodyInputWrapper>
					<VariableInput
						requestId={props.requestId}
						parts={props.value.value}
						onChange={parts =>
							dispatch(
								editorContext.valueChange({
									id,
									requestId,
									value: parts,
								}),
							)
						}
					/>
				</BodyInputWrapper>
			}
			actions={<EntryActions id={id} entry={value} requestId={requestId} />}
		/>
	);
};

export default JsonNumberEntry;
