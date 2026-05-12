import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { startExtensions } from '../store/extensions/actions';
import { startGit } from '../store/git/actions';
import {
	loadEditorPreferences,
	loadProjectPanePreferences,
	loadSidebarPreferences,
} from '../store/preferences/actions';
import { revealRequestExternal, startProject } from '../store/project/actions';

/**
 * Boots a Beak project window: dispatches the preference loads, kicks off
 * the project / extensions / git startup sagas, and wires the `reveal_request`
 * IPC event (fired by the OS when another window asks us to focus a request).
 *
 * Runs once on mount.
 */
export function useProjectBootstrap() {
	const dispatch = useDispatch();

	useEffect(() => {
		dispatch(loadEditorPreferences());
		dispatch(loadSidebarPreferences());
		dispatch(loadProjectPanePreferences());
		dispatch(startProject());
		dispatch(startExtensions());
		dispatch(startGit());

		window.secureBridge.ipc.on('reveal_request', (_event, payload) => {
			const typed = payload as { requestId: string };
			dispatch(revealRequestExternal(typed.requestId));
		});
	}, []);
}
