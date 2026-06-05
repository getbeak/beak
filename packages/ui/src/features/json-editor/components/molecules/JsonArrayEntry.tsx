import { TypedObject } from '@beak/common/helpers/typescript';
import { useAppSelector } from '@beak/ui/store/redux';
import type { ArrayEntry, NamedArrayEntry } from '@getbeak/types/body-editor-json';
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

interface JsonArrayEntryProps extends JsonEntryProps {
	value: ArrayEntry | NamedArrayEntry;
}

const JsonArrayEntry: React.FC<React.PropsWithChildren<JsonArrayEntryProps>> = props => {
	const { depth, requestId, nameOverride, value } = props;
	const { id } = value;
	const preferences = useAppSelector(s => s.global.preferences.requests[requestId]);
	const [expanded, setExpanded] = useState(preferences?.request.jsonEditor?.expanded[id] !== false);
	const editorContext = useContext(JsonEditorContext)!;

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
				type={<TypeSelector id={id} requestId={requestId} value={value.type} />}
				value={
					<BodyLabelValueCell style={{ fontVariantNumeric: 'tabular-nums' }}>
						{`${children.length} ${children.length === 1 ? 'item' : 'items'}`}
					</BodyLabelValueCell>
				}
				actions={<EntryActions id={id} entry={value} requestId={requestId} />}
			/>
			{expanded && children.length === 0 && <EntryEmptyState parentId={id} parentType='array' depth={depth} />}
			{expanded &&
				children.map((c, i) => (
					<JsonEntry depth={depth + 1} key={c.id} requestId={requestId} value={c} nameOverride={`Index ${i}`} />
				))}
		</React.Fragment>
	);
};

export default JsonArrayEntry;
