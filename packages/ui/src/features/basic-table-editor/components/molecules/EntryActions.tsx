import { Flex } from '@chakra-ui/react';
import ActionIconButton from '@beak/ui/components/molecules/ActionIconButton';
import { faMinus } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';

interface EntryActionsProps {
	onRemove: () => void;
}

const EntryActions: React.FC<EntryActionsProps> = ({ onRemove }) => (
	<Flex h='100%' direction='row' justify='flex-end' align='center'>
		<ActionIconButton tabIndex={-1} icon={faMinus} onClick={() => onRemove()} />
	</Flex>
);

export default EntryActions;
