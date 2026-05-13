import { IconButton } from '@chakra-ui/react';
import { Trash2 } from 'lucide-react';
import * as React from 'react';

interface EntryActionsProps {
	onRemove: () => void;
}

const EntryActions: React.FC<EntryActionsProps> = ({ onRemove }) => (
	<IconButton
		aria-label='Remove row'
		title='Remove row'
		size='xs'
		variant='ghost'
		color='fg.subtle'
		tabIndex={-1}
		h='18px'
		w='18px'
		minW='18px'
		borderRadius='sm'
		_hover={{
			color: 'accent.alert',
			bg: 'color-mix(in srgb, var(--beak-colors-accent-alert) 18%, transparent)',
		}}
		_focus={{ outline: 'none', color: 'accent.alert' }}
		_active={{ transform: 'scale(0.92)' }}
		transition='color .12s ease, background .12s ease, transform .08s ease'
		onClick={() => onRemove()}
	>
		<Trash2 size={11} strokeWidth={2.2} />
	</IconButton>
);

export default EntryActions;
