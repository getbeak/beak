import React from 'react';
import { ipcDialogService } from '@beak/app/lib/ipc';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { CellAction } from '../atoms/Cells';

interface CellDeletionActionProps {
	name: string;
	onConfirmedDeletion: () => void;
}

const CellDeletionAction: React.FunctionComponent<CellDeletionActionProps> = props => (
	<CellAction>
		<FontAwesomeIcon
			icon={faTrashAlt}
			color={'white'}
			fontSize={'10px'}
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

				if (result.response === 1)
					return;

				props.onConfirmedDeletion();
			}}
		/>
	</CellAction>
);

export default CellDeletionAction;
