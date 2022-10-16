import { TypedObject } from '@beak/common/helpers/typescript';
import Squawk from '@beak/common/utils/squawk';
import { differenceInDays } from 'date-fns';
import { app } from 'electron';

import { createPortalWindow, windowStack } from '../window-management';
import logger from './logger';
import nestClient from './nest-client';
import persistentStore from './persistent-store';

class Arbiter {
	private interval: NodeJS.Timer | undefined;

	start() {
		this.restartCheckHandler();
		this.checkAndHandle();
	}

	restartCheckHandler() {
		if (this.interval)
			clearInterval(this.interval);

		this.interval = setInterval(() => this.checkAndHandle(), 1800000); // 30 minutes
	}

	getStatus() {
		return persistentStore.get('arbiter');
	}

	async check() {
		const auth = await nestClient.getAuth();
		let status = this.getStatus();

		logger.info('arbiter: checking status');

		if (!auth)
			return;

		try {
			logger.info('arbiter: ensuring active subscription');

			await nestClient.ensureActiveSubscription();

			logger.info('arbiter: ensured active subscription');

			status = {
				lastSuccessfulCheck: new Date().toISOString(),
				lastCheckError: null,
				lastCheck: new Date().toISOString(),
				status: true,
			};
		} catch (error) {
			logger.error('arbiter: ensure subscription has failed', error);

			const squawk = Squawk.coerce(error);
			const expired = checkExpired(status.lastSuccessfulCheck);

			logger.error('arbiter: coerced failure', squawk);

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

				// If there is no active subscription, flag for reset
				case squawk.code === 'no_active_subscription':
					status.status = false;
					break;

				// If the token information is invalid, clear local auth
				case ['unauthorized', 'authorization_not_found'].includes(squawk.code): {
					await nestClient.setAuth(null);

					status.status = false;

					logger.error('Known but unknown error in arbiter fetching');
					app.relaunch();
					app.exit();

					break;
				}

				default:
					logger.error('Unknown error checking subscription status');

					break;
			}
		} finally {
			TypedObject.values(windowStack).forEach(window => {
				if (!window)
					return;

				window.webContents.send('arbiter_broadcast', { code: 'status_update', payload: status });
			});
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
		}
	}

	checkAndHandle() {
		this.check().catch(error => logger.error('arbiter: preview user check failed', error));
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
