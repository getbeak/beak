import { captureException } from '@sentry/electron/renderer';

import { ipcDialogService, ipcWindowService } from '../lib/ipc';

window.addEventListener('error', event => handleUnhandledError(event.error));
window.addEventListener('unhandledrejection', event => handleUnhandledError(event.reason));

const development = import.meta.env.MODE === 'development';
let failure = false;

export async function handleUnhandledError(error: Error) {
	if (!error || failure) return;
	failure = true;

	captureException(error);

	if (!development) window.setTimeout(() => ipcWindowService.reloadSelfWindow(), 0);

	await ipcDialogService.showMessageBox({
		title: 'Beak messed up…',
		type: 'error',
		message: 'Beak encountered an unknown error. If restarting doesn’t resolve the issue, please contact support.',
		detail: [error.name ?? '', error.message ?? '', error.stack ?? ''].join('\n'),
		buttons: [development ? 'Ignore' : 'Restart'],
		defaultId: 0,
	});

	// In dev we don't auto-reload, so reset the flag once the user has
	// acknowledged this error — otherwise every subsequent error stays
	// silenced for the rest of the session.
	if (development) failure = false;
}
