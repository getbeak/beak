import RequestPreferencesContext from '@beak/app/features/request-pane/contexts/request-preferences-context';
import { actions } from '@beak/app/store/project';
import { TypedObject } from '@beak/common/helpers/typescript';
import { ArrayEntry, NamedArrayEntry } from '@beak/common/types/beak-json-editor';
import { RequestBodyJson, RequestNode } from '@beak/common/types/beak-project';
import React, { useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

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

interface JsonArrayEntryProps extends JsonEntryProps {
	value: ArrayEntry | NamedArrayEntry;
}

const JsonArrayEntry: React.FunctionComponent<JsonArrayEntryProps> = props => {
	const dispatch = useDispatch();
	const { depth, requestId, nameOverride, value } = props;
	const { id, parentId } = value;
	const reqPref = useContext(RequestPreferencesContext);
	const [expanded, setExpanded] = useState(reqPref!.getPreferences().jsonEditor?.expands[id]);

	const entries = useSelector(s =>
		((s.global.project.tree[requestId] as RequestNode).info.body as RequestBodyJson).payload,
	);
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
				<BodyLabelValueCell>
					{`${children.length} ${children.length === 1 ? 'item' : 'items'}`}
				</BodyLabelValueCell>
				<BodyAction>
					<EntryActions id={id} isRoot={parentId === null} requestId={requestId} />
				</BodyAction>
			</Row>
			{expanded && children.map((c, i) => (
				<JsonEntry
					// eslint-disable-next-line @typescript-eslint/restrict-plus-operands
					depth={depth + 1}
					key={c.id}
					requestId={requestId}
					value={c}
					nameOverride={`Index ${i}`}
				/>
			))}
		</React.Fragment>
	);
};

export default JsonArrayEntry;
