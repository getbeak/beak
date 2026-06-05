import type { NotificationConstructorOptions } from 'electron/main';
import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

export const NotificationMessages = {
	SendNotification: 'send_notification',
	NotificationBeep: 'notification_beep',
};

export interface SendNotificationReq extends NotificationConstructorOptions {}

export class IpcNotificationServiceRenderer extends IpcServiceRenderer<'notification'> {
	constructor(ipc: PartialIpcRenderer) {
		super('notification', ipc);
	}

	async sendNotification(payload: SendNotificationReq) {
		return this.invoke(NotificationMessages.SendNotification, payload);
	}

	async notificationBeep() {
		return this.invoke(NotificationMessages.NotificationBeep);
	}
}

export class IpcNotificationServiceMain extends IpcServiceMain<'notification'> {
	constructor(ipc: PartialIpcMain) {
		super('notification', ipc);
	}

	registerSendNotification(fn: IpcListener<SendNotificationReq>) {
		this.registerRequestHandler(NotificationMessages.SendNotification, fn);
	}

	registerNotificationBeep(fn: IpcListener<void>) {
		this.registerRequestHandler(NotificationMessages.NotificationBeep, fn);
	}
}
