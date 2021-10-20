import { MenuEventPayload } from '@beak/common/web-contents/types';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { requestFlight } from '../store/flight/actions';
import { closeAllSelectedTabs } from '../store/project/actions';

export function useApplicationMenuEventListener() {
	const dispatch = useDispatch();

	useEffect(() => {
		function listener(_event: unknown, payload: MenuEventPayload) {
			const { code } = payload;

			switch (code) {
				case 'close_all_tabs': {
					dispatch(closeAllSelectedTabs());
					break;
				}

				case 'execute_request': {
					dispatch(requestFlight());
					break;
				}

				default:
					console.warn('Unknown menu item event', payload);
					break;
			}
		}

		window.secureBridge.ipc.on('menu:menu_item_click', listener);
	}, []);
}
