import { IpcDialogServiceMain, type ShowMessageBoxReq } from '@beak/common/ipc/dialog';

import { webIpcMain } from './ipc';

const service = new IpcDialogServiceMain(webIpcMain);

service.registerShowMessageBox(async (_event, payload: ShowMessageBoxReq) => {
	alert(`Dialog raised:
title: ${payload.title} (icon: ${payload.icon})
message: ${payload.message}
detail: ${payload.detail}
button opts: ${payload.buttons}
`);

	return { checkboxChecked: false, response: 0 };
});

service.registerShowOpenDialog(async (_event, _payload) => {
	// Web has no native folder picker yet — the clone flow on web supplies a
	// virtual lightning-fs path directly, no chooser needed. When we wire
	// the File System Access API as the third storage mode this stub will
	// return the picked handle's resolved path.
	return { canceled: true, filePaths: [] };
});
