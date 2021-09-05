import { IpcNestServiceMain } from '@beak/common/ipc/nest';
import { ipcMain } from 'electron';

import arbiter from '../lib/arbiter';
import nestClient from '../lib/nest-client';
import persistentStore from '../lib/persistent-store';
import { createWelcomeWindow, stackMap, windowStack } from '../window-management';

const service = new IpcNestServiceMain(ipcMain);

service.registerSendMagicLink(async (_event, email) => {
	await nestClient.sendMagicLink(email);
});

service.registerHandleMagicLink(async (_event, payload) => {
	await nestClient.handleMagicLink(payload.code, payload.state);
	await arbiter.check();

	if (!payload.fromOnboarding)
		return;

	const onboardingWindowId = stackMap.onboarding;

	if (onboardingWindowId !== void 0) {
		const onboardingWindow = windowStack[onboardingWindowId];

		onboardingWindow?.close();
	}

	persistentStore.set('passedOnboarding', true);
	createWelcomeWindow();
});

service.registerListNewsItems(async (_event, clientId) => await nestClient.listNewsItems(clientId));
