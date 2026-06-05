import { useEffect } from 'react';

import { ipcWindowService } from '../lib/ipc';
import { useAppSelector } from '../store/redux';
import { useSaveProjectAs } from './use-save-project-as';

/**
 * Keeps the host informed about whether this window has unsaved in-memory
 * changes (project mode is `memory` AND the tree has at least one node), so
 * the BrowserWindow `close` handler can prompt the user before discarding.
 *
 * Also wires the host's `window:request_save` IPC — fired when the user
 * picks "Save…" in the unsaved-changes dialog — to the materialise flow.
 *
 * Embedded (electron) only; the web host has the browser's own
 * beforeunload protection and no equivalent IPC.
 */
const embedded = Boolean(window.embeddedIndicator);

export function useUnsavedChangesGuard() {
	const isDirty = useAppSelector(
		s => s.global.project.mode === 'memory' && Object.keys(s.global.project.tree).length > 0,
	);
	const saveProjectAs = useSaveProjectAs();

	useEffect(() => {
		if (!embedded) return;
		void ipcWindowService.setDirty({ dirty: isDirty });
	}, [isDirty]);

	useEffect(() => {
		if (!embedded) return;
		function onRequestSave() {
			void saveProjectAs();
		}
		window.secureBridge.ipc.on('window:request_save', onRequestSave);
		return () => {
			window.secureBridge.ipc.off('window:request_save', onRequestSave);
		};
	}, [saveProjectAs]);
}
