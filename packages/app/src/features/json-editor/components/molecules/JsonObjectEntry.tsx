import React, { useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DebouncedInput from '@beak/app/components/atoms/DebouncedInput';
import SelectedNodeContext from '@beak/app/features/request-pane/contexts/selected-node';
import { actions } from '@beak/app/store/project';
import { TypedObject } from '@beak/common/helpers/typescript';
import { NamedObjectEntry, ObjectEntry } from '@beak/common/types/beak-json-editor';
import { RequestBodyJson } from '@beak/common/types/beak-project';

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
}

const JsonObjectEntry: React.FunctionComponent<JsonObjectEntryProps> = props => {
	const { depth, requestId, value, nameOverride } = props;
	const { id } = value;
	const dispatch = useDispatch();
	const node = useContext(SelectedNodeContext);
	const preferences = useSelector(s => s.global.preferences.requests[requestId]);
	const [expanded, setExpanded] = useState(preferences.request.jsonEditor?.expanded[id] !== false);

	const entries = (node.info.body as RequestBodyJson).payload;
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
								onChange={name => dispatch(actions.requestBodyJsonEditorNameChange({
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
