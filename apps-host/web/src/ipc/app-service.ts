import { IpcAppServiceMain } from '@beak/common/ipc/app';

import { webIpcMain } from './ipc';

const service = new IpcAppServiceMain(webIpcMain);

// TODO(afr): Real version needed
service.registerGetVersion(async () => '1.1.7');
// service.registerGetPlatform(async () => 'browser');
