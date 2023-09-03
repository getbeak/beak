import React from 'react';
import { ipcDialogService } from '@beak/ui/lib/ipc';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTheme } from 'styled-components';

import { CellAction } from '../atoms/Cells';

interface CellDeletionActionProps {
	name: string;
	onConfirmedDeletion: () => void;
}

const CellDeletionAction: React.FC<React.PropsWithChildren<CellDeletionActionProps>> = props => {
	const theme = useTheme();

	return (
		<CellAction onClick={async () => {
			const result = await ipcDialogService.showMessageBox({
				title: 'Are you sure?',
				message: `Are you sure you want to remove ${props.name}?`,
				detail: 'This action cannot be undone from inside Beak',
				type: 'warning',
				buttons: ['Remove', 'Cancel'],
				defaultId: 1,
				cancelId: 1,
			});

			if (result.response === 1)
				return;

			props.onConfirmedDeletion();
		}}>
			<FontAwesomeIcon
				icon={faTrashAlt}
				color={theme.ui.textOnSurfaceBackground}
				fontSize={'10px'}
			/>
		</CellAction>
	);
};

export default CellDeletionAction;
