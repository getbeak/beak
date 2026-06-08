import { IpcNotificationServiceMain } from '@beak/common/ipc/notification';

import getRuntime from '../host';
import { webIpcMain } from './ipc';

const service = new IpcNotificationServiceMain(webIpcMain);

service.registerSendNotification(async (_event, payload) => getRuntime().providers.notification.sendNotification(payload));
service.registerNotificationBeep(async () => getRuntime().providers.notification.beep());
