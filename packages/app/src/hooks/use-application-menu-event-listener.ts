import { MenuEventPayload } from '@beak/common/web-contents/types';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { showEncryptionView } from '../features/encryption/store/actions';
import { requestFlight } from '../store/flight/actions';
import { closeAllSelectedTabs, createNewFolder, createNewRequest } from '../store/project/actions';

export function useApplicationMenuEventListener() {
	const dispatch = useDispatch();

	useEffect(() => {
		function listener(_event: unknown, payload: MenuEventPayload) {
			const { code } = payload;

			switch (code) {
				case 'new_folder':
					dispatch(createNewFolder({ highlightedNodeId: void 0 }));
					break;
				case 'new_request':
					dispatch(createNewRequest({ highlightedNodeId: void 0 }));
					break;

				case 'close_all_tabs':
					dispatch(closeAllSelectedTabs());
					break;

				case 'execute_request':
					dispatch(requestFlight());
					break;
				case 'view_project_encryption':
					dispatch(showEncryptionView());
					break;

				default:
					console.warn('Unknown menu item event', payload);
					break;
			}
		}

		window.secureBridge.ipc.on('menu:menu_item_click', listener);
	}, []);
}
