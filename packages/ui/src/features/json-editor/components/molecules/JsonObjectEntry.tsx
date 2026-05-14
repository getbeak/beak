import { TypedObject } from '@beak/common/helpers/typescript';
import { useAppSelector } from '@beak/ui/store/redux';
import type { EntryType, NamedObjectEntry, ObjectEntry } from '@getbeak/types/body-editor-json';
import React, { useContext, useState } from 'react';

import { JsonEditorContext } from '../../contexts/json-editor-context';
import { BodyLabelValueCell } from '../atoms/Cells';
import EntryActions from './EntryActions';
import EntryEmptyState from './EntryEmptyState';
import EntryFolder from './EntryFolder';
import EntryPrimary from './EntryPrimary';
import EntryRow from './EntryRow';
import EntryToggler from './EntryToggler';
import { JsonEntry, type JsonEntryProps } from './JsonEntry';
import TypeSelector from './TypeSelector';

interface JsonObjectEntryProps extends JsonEntryProps {
	value: ObjectEntry | NamedObjectEntry;
	forceRootObject?: boolean;
}

const ROOT_CONTAINER_TYPES: EntryType[] = ['object', 'array'];

const JsonObjectEntry: React.FC<React.PropsWithChildren<JsonObjectEntryProps>> = props => {
	const { depth, requestId, value, nameOverride, forceRootObject } = props;
	const { id } = value;

	const editorContext = useContext(JsonEditorContext)!;
	const preferences = useAppSelector(s => s.global.preferences.requests[requestId]);
	const [expanded, setExpanded] = useState(preferences?.request.jsonEditor?.expanded[id] !== false);

	const entries = useAppSelector(editorContext.editorSelector);
	const children = TypedObject.values(entries).filter(e => e.parentId === id);
	const isRoot = depth === 0;

	return (
		<React.Fragment>
			<EntryRow
				id={id}
				depth={depth}
				parentId={value.parentId}
				canDrag={!isRoot}
				folder={
					<EntryFolder id={id} expanded={expanded} requestId={requestId} onChange={expanded => setExpanded(expanded)} />
				}
				toggle={<EntryToggler id={id} requestId={requestId} value={value.enabled} />}
				primary={<EntryPrimary depth={depth} requestId={requestId} value={value} nameOverride={nameOverride} />}
				type={
					<TypeSelector
						disabled={forceRootObject}
						allowedTypes={isRoot ? ROOT_CONTAINER_TYPES : void 0}
						id={id}
						requestId={requestId}
						value={value.type}
					/>
				}
				value={
					<BodyLabelValueCell style={{ fontVariantNumeric: 'tabular-nums' }}>
						{`${children.length} ${children.length === 1 ? 'key' : 'keys'}`}
					</BodyLabelValueCell>
				}
				actions={<EntryActions id={id} entry={value} requestId={requestId} />}
			/>
			{expanded && children.length === 0 && <EntryEmptyState parentId={id} parentType='object' depth={depth} />}
			{expanded && children.map(c => <JsonEntry depth={depth + 1} key={c.id} requestId={requestId} value={c} />)}
		</React.Fragment>
	);
};

export default JsonObjectEntry;
