import { createProjectMainWindow } from '@beak/apps-host-electron/window-management';
import type { BrowserWindow } from 'electron';

import getRuntime from '.';

/**
 * Validate and open a project folder, creating a project window on success.
 *
 * Returns the window ID on success, or `null` when the project could not be
 * opened (the adapter already surfaced the error to the user).
 *
 * `silent` suppresses error dialogs — used for automated re-open on startup.
 */
export async function tryOpenProjectFolder(projectPath: string, silent = false): Promise<number | null> {
	const result = await getRuntime().projectOpener.openProjectFolder(projectPath, silent);

	if (!result) return null;

	return await createProjectMainWindow(result.id, result.filePath);
}

/**
 * Show the native "Open Beak project" dialog and open the chosen project.
 *
 * An optional `browserWindow` hint parents the dialog to a specific window
 * on platforms that support it.
 */
export async function openProjectDialog(browserWindow?: BrowserWindow): Promise<void> {
	const pickedPath = await getRuntime().projectOpener.pickProjectFolder(browserWindow);

	if (!pickedPath) return;

	await tryOpenProjectFolder(pickedPath);
}
