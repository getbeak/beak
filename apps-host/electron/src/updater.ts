import { app, dialog, shell } from 'electron';
import { autoUpdater, UpdateInfo } from 'electron-updater';
import { parse } from 'semver';

import getBeakHost from './host';
import { createAndSetMenu } from './utils/menu';

// NOTE(afr): Update this to point to release news item, when that's done
export const latestReleaseNotesUrl = 'https://getbeak.notion.site/Beak-manual-8c908d9584f34b8db19267dcc6206e9e';
export const getUpdateDownloading = () => updateDownloading;
export const getCheckingForUpdates = () => checkingForUpdates;

let pendingUpdate: UpdateInfo | null = null;
let checkingForUpdates = false;
let updateDownloading = false;

autoUpdater.logger = getBeakHost().providers.logger;
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('update-available', () => {
	updateDownloading = true;
	checkingForUpdates = false;
	createAndSetMenu();
});

autoUpdater.on('update-cancelled', () => {
	checkingForUpdates = false;
	createAndSetMenu();
});
autoUpdater.on('update-not-available', () => {
	checkingForUpdates = false;
	createAndSetMenu();
});

// We only want to show the user this when the update is ready to go
autoUpdater.on('update-downloaded', async (event: UpdateInfo) => {
	pendingUpdate = event;
	updateDownloading = false;
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
	const latestKnownVersion = await getBeakHost().providers.storage.get('latestKnownVersion');

	if (version === latestKnownVersion)
		return;

	await getBeakHost().providers.storage.set('latestKnownVersion', version);

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
