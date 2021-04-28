import { IpcNestServiceMain } from '@beak/common/ipc/nest';
import { ipcMain } from 'electron';

import nestClient from '../lib/nest-client';

const service = new IpcNestServiceMain(ipcMain);

service.registerSendMagicLink(async (_event, email) => {
	await nestClient.sendMagicLink(email);
});

service.registerHandleMagicLink(async (_event, payload) => {
	await nestClient.handleMagicLink(payload.code, payload.state);

	// TODO(afr): Handle if we came from onboarding
});

