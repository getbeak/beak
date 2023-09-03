import { IpcNestServiceMain } from '@beak/common/ipc/nest';
import Squawk from '@beak/common/utils/squawk';

import { webIpcMain } from './ipc';

const service = new IpcNestServiceMain(webIpcMain);

service.registerCreateTrialAndMagicLink(async () => console.warn('Not implemented: `registerCreateTrialAndMagicLink`'));
service.registerGetUser(async () => {
	console.warn('Not implemented: `registerGetUser`');

	throw new Squawk('not_authenticated');
});
service.registerHandleMagicLink(async () => console.warn('Not implemented: `registerHandleMagicLink`'));
service.registerHasAuth(async () => true);
service.registerListNewsItems(async () => {
	console.warn('Not implemented: `registerListNewsItems`');

	throw new Squawk('not_authenticated');
});
service.registerSendMagicLink(async () => console.warn('Not implemented: `registerSendMagicLink`'));
