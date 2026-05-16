import type { MenuEventCode, MenuEventPayload } from '@beak/common/web-contents/types';
import { requestFlight } from '@beak/state/flight';
import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { showEncryptionView } from '../features/encryption/store/actions';
import { showOmniBar } from '../features/omni-bar/store/actions';
import { actions as openApiImportActions } from '../features/openapi-import/store';
import {
	changeTab,
	changeTabNext,
	changeTabPrevious,
	closeTabsAll,
	closeTabsOther,
} from '../features/tabs/store/actions';
import { exportProjectToLocalFolder } from '../features/welcome/lib/export-to-local-folder';
import { useAppSelector } from '../store/redux';
import { closeTabIntent, createNewFolder, createNewRequest } from '../store/project/actions';
import { useSaveProjectAs } from './use-save-project-as';

const embedded = Boolean(window.embeddedIndicator);

/**
 * Returns a dispatcher that runs the action behind a `MenuEventCode`. Used by
 * the electron IPC listener and the web-host menu bar so both shells route
 * through one switch.
 */
export function useMenuActionDispatcher() {
	const dispatch = useDispatch();
	const saveProjectAs = useSaveProjectAs();
	const projectId = useAppSelector(s => s.global.project.id ?? null);
	const projectName = useAppSelector(s => s.global.project.name ?? '');

	return useCallback(
		(code: MenuEventCode) => {
			switch (code) {
				case 'new_folder':
					dispatch(createNewFolder({ highlightedNodeId: void 0 }));
					break;
				case 'new_request':
					dispatch(createNewRequest({ highlightedNodeId: void 0 }));
					break;

				case 'close_all_tabs':
					dispatch(closeTabsAll());
					break;
				case 'close_other_tabs':
					dispatch(closeTabsOther());
					break;
				case 'close_tab':
					dispatch(closeTabIntent(undefined));
					break;
				case 'select_next_tab':
					dispatch(changeTabNext());
					break;
				case 'select_previous_tab':
					dispatch(changeTabPrevious());
					break;

				case 'execute_request':
					dispatch(requestFlight());
					break;
				case 'view_project_encryption':
					dispatch(showEncryptionView());
					break;
				case 'show_new_project_intro':
					dispatch(changeTab({ type: 'new_project_intro', temporary: false, payload: 'new_project_intro' }));
					break;

				case 'show_omni_commands':
					dispatch(showOmniBar({ mode: 'commands' }));
					break;

				case 'show_preferences':
					dispatch(changeTab({ type: 'preferences', temporary: false, payload: 'preferences' }));
					break;

				case 'show_project_home':
					dispatch(changeTab({ type: 'project_home', temporary: false, payload: 'project_home' }));
					break;

				case 'show_variable_input_lab':
					dispatch(
						changeTab({
							type: 'variable_input_playground',
							temporary: false,
							payload: 'variable_input_playground',
						}),
					);
					break;

				case 'import_openapi_spec':
					dispatch(openApiImportActions.start());
					break;

				case 'save_project_as':
					void saveProjectAs();
					break;

				case 'export_to_local_folder':
					if (!projectId) break;
					void (async () => {
						const outcome = await exportProjectToLocalFolder({
							projectId,
							projectName: projectName || 'Beak Project',
						});
						if (outcome.ok) window.location.reload();
					})();
					break;

				default:
					console.warn('Unknown menu item event', code);
					break;
			}
		},
		[dispatch, saveProjectAs, projectId, projectName],
	);
}

export function useApplicationMenuEventListener() {
	const dispatchMenuCode = useMenuActionDispatcher();

	useEffect(() => {
		if (!embedded) return;

		function listener(_event: unknown, payload: MenuEventPayload) {
			dispatchMenuCode(payload.code);
		}

		window.secureBridge.ipc.on('menu:menu_item_click', listener);
		return () => {
			window.secureBridge.ipc.off('menu:menu_item_click', listener);
		};
	}, [dispatchMenuCode]);
}
