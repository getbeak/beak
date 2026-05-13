import { Flex } from '@chakra-ui/react';
import ActionIconButton from '@beak/ui/components/molecules/ActionIconButton';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import type { Entries } from '@getbeak/types/body-editor-json';
import * as React from 'react';
import { useContext } from 'react';
import { useDispatch } from 'react-redux';

import { JsonEditorContext } from '../../contexts/json-editor-context';

interface EntryActionsProps {
	requestId: string;
	id: string;
	entry: Entries;
}

const EntryActions: React.FC<EntryActionsProps> = ({ requestId, id, entry }) => {
	const isRoot = entry.parentId === null;
	const dispatch = useDispatch();
	const editorContext = useContext(JsonEditorContext)!;

	// Don't show any icons for root level primitives
	if (isRoot && !['array', 'object'].includes(entry.type)) return null;

	return (
		<Flex h='100%' direction='row' justify='flex-end' align='center'>
			{!isRoot && (
				<ActionIconButton
					tabIndex={-1}
					icon={faMinus}
					onClick={() => dispatch(editorContext.removeEntry({ id, requestId }))}
				/>
			)}
			<ActionIconButton
				tabIndex={-1}
				icon={faPlus}
				onClick={() => dispatch(editorContext.addEntry({ id, requestId }))}
			/>
		</Flex>
	);
};

export default EntryActions;
