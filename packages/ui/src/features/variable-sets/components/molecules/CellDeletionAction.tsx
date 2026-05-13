import { ipcDialogService } from '@beak/ui/lib/ipc';
import { Trash2 } from 'lucide-react';

import React from 'react';

import { CellAction } from '../atoms/Cells';

interface CellDeletionActionProps {
	name: string;
	onConfirmedDeletion: () => void;
}

const CellDeletionAction: React.FC<React.PropsWithChildren<CellDeletionActionProps>> = props => {

	return (
		<CellAction
			onClick={async () => {
				const result = await ipcDialogService.showMessageBox({
					title: 'Are you sure?',
					message: `Are you sure you want to remove ${props.name}?`,
					detail: 'This action cannot be undone from inside Beak',
					type: 'warning',
					buttons: ['Remove', 'Cancel'],
					defaultId: 1,
					cancelId: 1,
				});

				if (result.response === 1) return;

				props.onConfirmedDeletion();
			}}
		>
			<Trash2 color={'var(--beak-colors-fg-default)'} size={10} />
		</CellAction>
	);
};

export default CellDeletionAction;
