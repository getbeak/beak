import React, { useContext } from 'react';
import { useDispatch } from 'react-redux';
import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import type { NamedNullEntry, NullEntry } from '@getbeak/types/body-editor-json';

import { JsonEditorContext } from '../../contexts/json-editor-context';
import {
	BodyAction,
	BodyInputValueCell,
	BodyInputWrapper,
	BodyNameOverrideWrapper,
	BodyNullWrapper,
	BodyPrimaryCell,
	BodyTypeCell,
} from '../atoms/Cells';
import { Row } from '../atoms/Structure';
import EntryActions from './EntryActions';
import { EntryFolderIrrelevant } from './EntryFolder';
import EntryToggler from './EntryToggler';
import { detectName, JsonEntryProps } from './JsonEntry';
import TypeSelector from './TypeSelector';

interface JsonNullEntryProps extends JsonEntryProps {
	value: NullEntry | NamedNullEntry;
}

const JsonNullEntry: React.FC<React.PropsWithChildren<JsonNullEntryProps>> = props => {
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
				<BodyNullWrapper>
					{'null'}
				</BodyNullWrapper>
			</BodyInputValueCell>
			<BodyAction>
				<EntryActions id={id} entry={value} requestId={requestId} />
			</BodyAction>
		</Row>
	);
};

export default JsonNullEntry;
