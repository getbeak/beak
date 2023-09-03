import { IpcNotificationServiceMain, SendNotificationReq } from '@beak/common/ipc/notification';
import { ipcMain, Notification, shell } from 'electron';

const service = new IpcNotificationServiceMain(ipcMain);

service.registerSendNotification(async (_event, payload: SendNotificationReq) => {
	if (!Notification.isSupported())
		return;

	new Notification(payload).show();
});

service.registerNotificationBeep(async () => shell.beep());
