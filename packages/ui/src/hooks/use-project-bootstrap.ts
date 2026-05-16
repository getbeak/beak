import { markNoProject } from '@beak/state/project';
import { variableSetsOpened } from '@beak/state/variable-sets';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { tabStateLoaded } from '../features/tabs/store/actions';
import { startExtensions } from '../store/extensions/actions';
import { startGit } from '../store/git/actions';
import {
	loadEditorPreferences,
	loadProjectPanePreferences,
	loadSidebarPreferences,
} from '../store/preferences/actions';
import { revealRequestExternal, startProject } from '../store/project/actions';

function isEmptyWindow(): boolean {
	const params = new URLSearchParams(window.location.search);
	return params.get('empty') === '1';
}

/**
 * Boots a Beak project window: dispatches the preference loads, kicks off
 * the project / extensions / git startup sagas, and wires the `reveal_request`
 * IPC event (fired by the OS when another window asks us to focus a request).
 *
 * For empty windows (`?empty=1`) — the cold-start workbench with no project
 * bound — we skip every disk-touching effect and seed the slices directly so
 * the welcome tab renders immediately. The project, variable-sets and tabs
 * slices all need `loaded: true` before ProjectMain unblanks the chrome.
 *
 * Runs once on mount.
 */
export function useProjectBootstrap() {
	const dispatch = useDispatch();

	useEffect(() => {
		if (isEmptyWindow()) {
			dispatch(markNoProject());
			dispatch(variableSetsOpened({ variableSets: {} }));
			dispatch(
				tabStateLoaded({
					selectedTab: 'new_project_intro',
					activeTabs: [{ type: 'new_project_intro', temporary: false, payload: 'new_project_intro' }],
					recentlyClosedTabs: [],
					lastReconcile: 0,
					loaded: true,
				}),
			);
			return;
		}

		dispatch(loadEditorPreferences());
		dispatch(loadSidebarPreferences());
		dispatch(loadProjectPanePreferences());
		dispatch(startProject());
		dispatch(startExtensions());
		dispatch(startGit());

		function onRevealRequest(_event: unknown, payload: unknown) {
			const typed = payload as { requestId: string };
			dispatch(revealRequestExternal(typed.requestId));
		}

		window.secureBridge.ipc.on('reveal_request', onRevealRequest);
		return () => {
			window.secureBridge.ipc.off('reveal_request', onRevealRequest);
		};
	}, [dispatch]);
}
