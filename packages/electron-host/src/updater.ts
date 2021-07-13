import { Notification } from 'electron';
import { autoUpdater } from 'electron-updater';

autoUpdater.on('update-available', () => {
	if (!Notification.isSupported())
		return;

	new Notification({
		title: 'Update available',
		body: 'A new version of Beak is available, and is being downloaded',
		silent: true,
	}).show();
});

autoUpdater.on('update-downloaded', () => {
	if (!Notification.isSupported())
		return;

	if (process.platform === 'darwin') {
		const notification = new Notification({
			title: 'Update ready',
			body: 'Beak update has downloaded. Would you like to install it now?',
			actions: [{
				text: 'Install now',
				type: 'button',
			}],
			closeButtonText: 'Later',

		});

		notification.on('click', () => autoUpdater.quitAndInstall());
		notification.on('action', (_event, index) => {
			if (index === 0)
				autoUpdater.quitAndInstall();
		});

		notification.show();

		return;
	}

	new Notification({
		title: 'Update ready',
		body: 'Beak update has downloaded. It will be installed next time you start Beak.',
	}).show();
});
