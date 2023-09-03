import React, { useContext, useState } from 'react';
import { useDispatch } from 'react-redux';
import { TypedObject } from '@beak/common/helpers/typescript';
import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import { useAppSelector } from '@beak/ui/store/redux';
import type { NamedObjectEntry, ObjectEntry } from '@getbeak/types/body-editor-json';

import { JsonEditorContext } from '../../contexts/json-editor-context';
import {
	BodyAction,
	BodyInputWrapper,
	BodyLabelValueCell,
	BodyNameOverrideWrapper,
	BodyPrimaryCell,
	BodyTypeCell,
} from '../atoms/Cells';
import { Row } from '../atoms/Structure';
import EntryActions from './EntryActions';
import EntryFolder from './EntryFolder';
import EntryToggler from './EntryToggler';
import { detectName, JsonEntry, JsonEntryProps } from './JsonEntry';
import TypeSelector from './TypeSelector';

interface JsonObjectEntryProps extends JsonEntryProps {
	value: ObjectEntry | NamedObjectEntry;
	forceRootObject?: boolean;
}

const JsonObjectEntry: React.FC<React.PropsWithChildren<JsonObjectEntryProps>> = props => {
	const { depth, requestId, value, nameOverride, forceRootObject } = props;
	const { id } = value;
	const dispatch = useDispatch();

	const editorContext = useContext(JsonEditorContext)!;
	const preferences = useAppSelector(s => s.global.preferences.requests[requestId]);
	const [expanded, setExpanded] = useState(preferences.request.jsonEditor?.expanded[id] !== false);

	const entries = useAppSelector(editorContext.editorSelector);
	const children = TypedObject.values(entries).filter(e => e.parentId === id);

	return (
		<React.Fragment>
			<Row>
				<BodyPrimaryCell depth={depth}>
					<EntryFolder
						id={id}
						expanded={expanded}
						requestId={requestId}
						onChange={expanded => setExpanded(expanded)}
					/>
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
						disabled={forceRootObject}
						id={id}
						requestId={requestId}
						value={value.type}
					/>
				</BodyTypeCell>
				<BodyLabelValueCell>
					{`${children.length} ${children.length === 1 ? 'key' : 'keys'}`}
				</BodyLabelValueCell>
				<BodyAction>
					<EntryActions id={id} entry={value} requestId={requestId} />
				</BodyAction>
			</Row>
			{expanded && children.map(c => (
				<JsonEntry
					// eslint-disable-next-line @typescript-eslint/restrict-plus-operands
					depth={depth + 1}
					key={c.id}
					requestId={requestId}
					value={c}
				/>
			))}
		</React.Fragment>
	);
};

export default JsonObjectEntry;
