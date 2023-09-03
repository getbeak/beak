import { IpcDialogServiceMain, ShowMessageBoxReq } from '@beak/common/ipc/dialog';

import { webIpcMain } from './ipc';

const service = new IpcDialogServiceMain(webIpcMain);

service.registerShowMessageBox(async (_event, payload: ShowMessageBoxReq) => {
	// eslint-disable-next-line no-alert
	alert(`Dialog raised:
title: ${payload.title} (icon: ${payload.icon})
message: ${payload.message}
detail: ${payload.detail}
button opts: ${payload.buttons}
`);

	return { checkboxChecked: false, response: 0 };
});
