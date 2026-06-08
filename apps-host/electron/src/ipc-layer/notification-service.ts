import { IpcNotificationServiceMain } from '@beak/common/ipc/notification';
import { ipcMain } from 'electron';

import getRuntime from '../host';

const service = new IpcNotificationServiceMain(ipcMain);

service.registerSendNotification(async (_event, payload) =>
	getRuntime().providers.notification.sendNotification(payload),
);
service.registerNotificationBeep(async () => getRuntime().providers.notification.beep());
