import type { SendNotificationReq } from '@beak/common/ipc/notification';
import NotificationPort from '@beak/runtime-shared/ports/notification';

export default class WebNotification extends NotificationPort {
	async sendNotification(payload: SendNotificationReq): Promise<void> {
		if (!(await checkIfPermissionsAllowed())) return;

		new Notification(payload.title ?? 'Title', {
			body: payload.body,
			icon: '/images/logo-title.png',
			// TODO(afr): Set custom type for this due to experimental status
			// vibrate: payload.silent ? void 0 : [200, 100, 200],
			silent: payload.silent,
			requireInteraction: payload.urgency === 'critical',
		});
	}

	async beep(): Promise<void> {
		// The web shell has no direct access to a system beep; this is a
		// deliberate no-op.  A future implementation could play a short audio
		// cue via the Web Audio API if desired.
		console.warn('Not implemented: notification beep');
	}
}

async function checkIfPermissionsAllowed(): Promise<boolean> {
	if (!window.isSecureContext) return false;
	if (!('Notification' in window)) return false;

	if (Notification.permission === 'granted') return true;

	const permission = await Notification.requestPermission();

	return permission === 'granted';
}
