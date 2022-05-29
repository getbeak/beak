import { captureException } from '@sentry/electron/renderer';

import { ipcDialogService, ipcWindowService } from '../lib/ipc';

window.addEventListener('error', event => handleUnhandledError(event.error));
window.addEventListener('unhandledrejection', event => handleUnhandledError(event.reason));

let failure = false;

export async function handleUnhandledError(error: Error) {
	captureException(error);

	if (!error || failure)
		return;

	failure = true;

	// window.setTimeout(() => ipcWindowService.reloadSelfWindow(), 0);
	// await ipcDialogService.showMessageBox({
	// 	title: 'Beak messed up...',
	// 	type: 'error',
	// 	message: 'Beak encountered an unknown error. If restarting doesn\'t resolve the issue, please contact support.',
	// 	detail: [
	// 		error.name ?? '',
	// 		error.message ?? '',
	// 		error.stack ?? '',
	// 	].join('\n'),
	// 	buttons: ['Restart'],
	// 	defaultId: 0,
	// });
}
