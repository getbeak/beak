import { requestFlight } from '@beak/state/flight';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { checkShortcut } from '../lib/keyboard-shortcuts';

/**
 * Window-level keyboard shortcuts. Only the truly global ones live here;
 * feature-scoped shortcuts (sidebar, omnibar, etc.) bind their own listeners
 * inside the relevant component.
 *
 * Only attaches once `enabled` flips to true (project loaded + setup) so it
 * doesn't fire while the loading splash is still showing.
 */
export function useGlobalKeyboardShortcuts(enabled: boolean) {
	const dispatch = useDispatch();

	useEffect(() => {
		if (!enabled) return;

		function onKeyDown(event: KeyboardEvent) {
			switch (true) {
				case checkShortcut('global.execute-request', event):
					event.stopPropagation();
					dispatch(requestFlight());
					break;
				default:
					return;
			}
			event.preventDefault();
		}

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [enabled]);
}
