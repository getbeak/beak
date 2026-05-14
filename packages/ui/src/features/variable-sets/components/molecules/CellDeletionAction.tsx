import { IconButton } from '@chakra-ui/react';
import { ipcDialogService } from '@beak/ui/lib/ipc';
import { Trash2 } from 'lucide-react';

import React from 'react';

interface CellDeletionActionProps {
	name: string;
	onConfirmedDeletion: () => void;
}

const CellDeletionAction: React.FC<React.PropsWithChildren<CellDeletionActionProps>> = ({
	name,
	onConfirmedDeletion,
}) => (
	<IconButton
		aria-label='Delete'
		title={`Delete ${name}`}
		size='xs'
		variant='ghost'
		color='fg.subtle'
		h='18px'
		w='18px'
		minW='18px'
		borderRadius='sm'
		transition='color .12s ease, background-color .12s ease, transform .08s ease'
		_hover={{
			color: 'accent.alert',
			bg: 'color-mix(in srgb, var(--beak-colors-accent-alert) 18%, transparent)',
		}}
		_active={{ transform: 'scale(0.92)' }}
		onClick={async () => {
			const result = await ipcDialogService.showMessageBox({
				title: 'Are you sure?',
				message: `Are you sure you want to remove ${name}?`,
				detail: 'This action cannot be undone from inside Beak.',
				type: 'warning',
				buttons: ['Remove', 'Cancel'],
				defaultId: 1,
				cancelId: 1,
			});

			if (result.response === 1) return;

			onConfirmedDeletion();
		}}
	>
		<Trash2 size={11} strokeWidth={2.2} />
	</IconButton>
);

export default CellDeletionAction;
