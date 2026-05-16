import type { NamedNullEntry, NullEntry } from '@getbeak/types/body-editor-json';
import React from 'react';

import { BodyNullWrapper } from '../atoms/Cells';
import EntryActions from './EntryActions';
import EntryPrimary from './EntryPrimary';
import EntryRow from './EntryRow';
import EntryToggler from './EntryToggler';
import type { JsonEntryProps } from './JsonEntry';
import TypeSelector from './TypeSelector';

interface JsonNullEntryProps extends JsonEntryProps {
	value: NullEntry | NamedNullEntry;
}

const JsonNullEntry: React.FC<React.PropsWithChildren<JsonNullEntryProps>> = props => {
	const { depth, requestId, value, nameOverride } = props;
	const { id } = value;
	const isRoot = depth === 0;

	return (
		<EntryRow
			id={id}
			depth={depth}
			parentId={value.parentId}
			canDrag={!isRoot}
			toggle={<EntryToggler id={id} requestId={requestId} value={value.enabled} />}
			primary={<EntryPrimary depth={depth} requestId={requestId} value={value} nameOverride={nameOverride} />}
			type={<TypeSelector requestId={requestId} id={id} value={value.type} />}
			value={<BodyNullWrapper>{'null'}</BodyNullWrapper>}
			actions={<EntryActions id={id} entry={value} requestId={requestId} />}
		/>
	);
};

export default JsonNullEntry;
