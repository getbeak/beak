import { IpcDialogServiceMain } from '@beak/common/ipc/dialog';

import WebDialog from '../adapters/dialog';
import { webIpcMain } from './ipc';

const service = new IpcDialogServiceMain(webIpcMain);
const dialog = new WebDialog();

service.registerShowMessageBox(async (_event, payload) => dialog.showMessageBox(payload));

service.registerShowOpenDialog(async (_event, payload) => dialog.showOpenDialog(payload));
