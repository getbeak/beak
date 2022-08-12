import { app, dialog, shell } from 'electron';
import { autoUpdater, UpdateInfo } from 'electron-updater';
import { parse } from 'semver';

import logger from './lib/logger';
import persistentStore from './lib/persistent-store';
import { createAndSetMenu } from './utils/menu';

export const latestReleaseNotesUrl = 'https://getbeak.notion.site/Beak-manual-8c908d9584f34b8db19267dcc6206e9e';
let pendingUpdate: UpdateInfo | null = null;

autoUpdater.logger = logger;
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// We only want to show the user this when the update is ready to go
autoUpdater.on('update-downloaded', async (event: UpdateInfo) => {
	pendingUpdate = event;

	// Update menu to say update is ready
	createAndSetMenu();

	const { response } = await dialog.showMessageBox({
		type: 'info',
		title: 'Update available',
		message: `Version ${event.version} of Beak is now available!`,
		detail: 'Grab it while it\'s hot',
		buttons: ['Update on next launch', 'Update now'],
		cancelId: 0,
		defaultId: 1,
	});

	if (response === 1)
		autoUpdater.quitAndInstall();
});

(function backgroundUpdateScheduler() {
	setInterval(() => {
		if (pendingUpdate)
			return;

		autoUpdater.checkForUpdates();
	}, 2700000); // 45 minutes
}());

export function getPendingUpdate() {
	return pendingUpdate;
}

export async function attemptShowPostUpdateWelcome() {
	const version = app.getVersion();
	const latestKnownVersion = persistentStore.get('latestKnownVersion');

	if (version === latestKnownVersion)
		return;

	persistentStore.set('latestKnownVersion', version);

	const parsedVersion = parse(version);

	if (parsedVersion?.prerelease.length === 0)
		return;

	const { response } = await dialog.showMessageBox({
		title: 'Beak has updated!',
		message: `Beak has just updated to version ${version}!`,
		detail: 'Would you like to look at the release notes?',
		type: 'info',
		buttons: ['Show release notes', 'Continue'],
		defaultId: 1,
	});

	if (response === 1)
		return;

	shell.openExternal(latestReleaseNotesUrl);
}
