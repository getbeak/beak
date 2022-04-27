import { IpcNestServiceMain } from '@beak/shared-common/ipc/nest';
import { ipcMain } from 'electron';

import arbiter from '../lib/arbiter';
import nestClient from '../lib/nest-client';
import persistentStore from '../lib/persistent-store';
import { createWelcomeWindow, stackMap, windowStack } from '../window-management';

const service = new IpcNestServiceMain(ipcMain);

service.registerSendMagicLink(async (_event, email) => {
	await nestClient.sendMagicLink(email);
});

service.registerCreateTrialAndMagicLink(async (_event, email) => {
	await nestClient.createTrialAndMagicLink(email);
});

service.registerHandleMagicLink(async (_event, payload) => {
	await nestClient.handleMagicLink(payload.code, payload.state);
	await arbiter.check();

	if (!payload.fromPortal)
		return;

	const portalWindowId = stackMap.portal;

	if (portalWindowId !== void 0) {
		const portalWindow = windowStack[portalWindowId];

		portalWindow?.close();
	}

	persistentStore.set('passedOnboarding', true);
	createWelcomeWindow();
});

service.registerListNewsItems(async (_event, clientId) => await nestClient.listNewsItems(clientId));
service.registerGetSubscriptionState(async () => await nestClient.getSubscriptionStatus());
service.registerGetUser(async () => await nestClient.getUser());
service.registerHasAuth(async () => Boolean(await nestClient.getAuth()));
