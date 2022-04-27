import { IpcNotificationServiceMain, SendNotificationReq } from '@beak/shared-common/ipc/notification';
import { ipcMain, Notification } from 'electron';

const service = new IpcNotificationServiceMain(ipcMain);

service.registerSendNotification(async (_event, payload: SendNotificationReq) => {
	if (!Notification.isSupported())
		return;

	new Notification(payload).show();
});
