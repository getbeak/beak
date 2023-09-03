import { IpcNotificationServiceMain } from '@beak/common/ipc/notification';

import { webIpcMain } from './ipc';

const service = new IpcNotificationServiceMain(webIpcMain);

service.registerNotificationBeep(async () => console.warn('Not implemented: `registerNotificationBeep`'));
service.registerSendNotification(async (_event, payload) => {
	if (!await checkIfPermissionsAllowed())
		return;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const notification = new Notification(payload.title ?? 'Title', {
		body: payload.body,
		icon: '/images/logo-title.png',
		vibrate: payload.silent ? void 0 : [200, 100, 200],
		silent: payload.silent,
		requireInteraction: payload.urgency === 'critical',
	});
});

async function checkIfPermissionsAllowed(): Promise<boolean> {
	if (!window.isSecureContext) return false;
	if (!('Notification' in window)) return false;

	if (Notification.permission === 'granted') return true;

	const permission = await Notification.requestPermission();

	return permission === 'granted';
}
