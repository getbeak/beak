import { IpcNestServiceMain } from '@beak/common/ipc/nest';
import Squawk from '@beak/common/utils/squawk';
import { ipcMain } from 'electron';

const service = new IpcNestServiceMain(ipcMain);

service.registerSendMagicLink(async (_event, _email) => {
	// Removed currently
});

service.registerCreateTrialAndMagicLink(async (_event, _email) => {
	// Removed currently
});

service.registerHandleMagicLink(async (_event, _payload) => {
	// Removed currently
});

service.registerListNewsItems(async (_event, _clientId) => []);
service.registerGetSubscriptionState(async () => {
	throw new Squawk('not_authenticated');
});
service.registerGetUser(async () => {
	throw new Squawk('not_authenticated');
});
service.registerHasAuth(async () => true);
