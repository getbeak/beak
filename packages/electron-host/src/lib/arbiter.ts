import { TypedObject } from '@beak/common/helpers/typescript';
import Squawk from '@beak/common/utils/squawk';
import { differenceInDays } from 'date-fns';

import { createPortalWindow, windowStack } from '../window-management';
import logger from './logger';
import nestClient from './nest-client';
import persistentStore from './persistent-store';

class Arbiter {
	start() {
		this.check().catch(error => logger.error('arbiter: preview user check failed', error));

		setInterval(() => {
			this.check().catch(error =>
				logger.error('arbiter: preview user check failed', error),
			);
		}, 1800000); // 30 minutes
	}

	getStatus() {
		return persistentStore.get('arbiter');
	}

	async check() {
		const auth = await nestClient.getAuth();
		let status = this.getStatus();

		if (!auth)
			return;

		try {
			await nestClient.ensureActiveSubscription();

			status = {
				lastSuccessfulCheck: new Date().toISOString(),
				lastCheckError: null,
				lastCheck: new Date().toISOString(),
				status: true,
			};
		} catch (error) {
			const squawk = Squawk.coerce(error);
			const expired = checkExpired(status.lastSuccessfulCheck);

			logger.warn('arbiter: preview user request failed', error, squawk);

			status = {
				lastSuccessfulCheck: status.lastSuccessfulCheck,
				lastCheckError: squawk,
				lastCheck: new Date().toISOString(),
				status: !expired,
			};

			switch (true) {
				// No internet connection, do nothing
				case squawk.code === 'ENOTFOUND':
					break;

				// If the token information is invalid, clear local auth
				case squawk.code === 'unauthorized': {
					await nestClient.setAuth(null);

					status.status = false;

					logger.error('Known but unknown error in arbiter fetching', squawk);

					break;
				}

				default:
					logger.error('Unknown error checking subscription status', error);

					break;
			}
		}

		persistentStore.set('arbiter', status);

		if (status.status === false) {
			nestClient.setAuth(null);

			const portalWindowId = createPortalWindow();

			TypedObject.values(windowStack).forEach(window => {
				if (window.id !== portalWindowId)
					window.close();
			});

			windowStack[portalWindowId].focus();
		} else {
			TypedObject.values(windowStack).forEach(window => {
				if (!window)
					return;

				window.webContents.send('arbiter_broadcast', { code: 'status_update', payload: status });
			});
		}
	}
}

function checkExpired(lastSuccessfulCheck: string) {
	const now = new Date();
	const lastCheck = new Date(lastSuccessfulCheck);
	const diff = differenceInDays(now, lastCheck);

	return diff >= 5;
}

const arbiter = new Arbiter();

export default arbiter;
