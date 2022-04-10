import { BrowserWindow, dialog } from 'electron';

import { tryOpenProjectFolder, windowProjectIdMapping } from '../lib/beak-project';
import persistentStore from '../lib/persistent-store';
import { windowStack } from '../window-management';

export default async function handleLaunch(url: URL) {
	switch (url.pathname) {
		case '/project':
			return await handleProject(url);

		default: return null;
	}
}

async function handleProject(url: URL) {
	const projectId = url.searchParams.get('projectId');
	const requestId = url.searchParams.get('requestId');

	if (!projectId || !requestId)
		return false;

	// Check if the project already has a window open
	const existingWindowId = windowProjectIdMapping[projectId];

	if (existingWindowId) {
		const window = windowStack[existingWindowId];

		if (window && !window.isDestroyed()) {
			window.focus();
			notifyToLoadRequest(window, requestId);

			return true;
		}
	}

	// Check if project is known about
	const projectPath = persistentStore.get('projectMappings')[projectId];

	if (!projectPath) {
		// TODO(afr): Write some real copy for this
		await dialog.showMessageBox({
			type: 'info',
			title: 'Unable to load project',
			message: 'Project not found locally',
		});

		return false;
	}

	const windowId = await tryOpenProjectFolder(projectPath);

	if (!windowId)
		return false;

	notifyToLoadRequest(BrowserWindow.fromId(windowId)!, requestId);

	return true;
}

function notifyToLoadRequest(window: BrowserWindow | undefined, requestId: string | undefined) {
	if (!window || !requestId)
		return;

	window.webContents.send('reveal_request', { requestId });
}
