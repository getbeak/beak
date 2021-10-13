import { MenuEventPayload } from '@beak/common/web-contents/types';
import { useEffect } from 'react';

export function useApplicationMenuEventListener() {
	useEffect(() => {
		function listener(_event: unknown, payload: MenuEventPayload) {
			const { code } = payload;

			switch (code) {
				default:
					console.warn('Unknown menu item event', payload);
			}
		}

		window.secureBridge.ipc.on('menu:menu_item_click', listener);
	}, []);
}
