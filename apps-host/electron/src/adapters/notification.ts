import type { SendNotificationReq } from '@beak/common/ipc/notification';
import NotificationPort from '@beak/runtime-shared/ports/notification';
import { Notification, shell } from 'electron';

export default class ElectronNotification extends NotificationPort {
	async sendNotification(payload: SendNotificationReq): Promise<void> {
		if (!Notification.isSupported()) return;

		new Notification(payload).show();
	}

	async beep(): Promise<void> {
		shell.beep();
	}
}
