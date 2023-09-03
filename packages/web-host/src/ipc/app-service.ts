import { IpcAppServiceMain } from '@beak/common/ipc/app';

import { webIpcMain } from './ipc';

const service = new IpcAppServiceMain(webIpcMain);

// TODO(afr): Real version needed
service.registerGetVersion(async () => '2.0.0');
// service.registerGetPlatform(async () => 'browser');
