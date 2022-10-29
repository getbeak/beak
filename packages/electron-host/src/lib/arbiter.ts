import { TypedObject } from '@beak/common/helpers/typescript';
import { ArbiterStatus } from '@beak/common/types/arbiter';
import Squawk from '@beak/common/utils/squawk';
import { differenceInDays } from 'date-fns';
import { app } from 'electron';

import { createPortalWindow, windowStack } from '../window-management';
import logger from './logger';
import nestClient from './nest-client';
import persistentStore from './persistent-store';

class Arbiter {
	constructor() {
		this.startScheduler();
	}

	getStatus() {
		return persistentStore.get('arbiter');
	}

	async check() {
		logger.info('arbiter: starting check');

		logger.info('arbiter: getting auth state');

		const auth = await nestClient.getAuth();

		if (!auth) {
			logger.info('arbiter: auth state null');

			return;
		}

		logger.info('arbiter: auth state exists with expiry', auth.expiresAt);

		logger.info('arbiter: getting status');

		let status = this.getStatus();

		logger.info('arbiter: status retrieved', status.lastCheck, status.lastCheckError);

		try {
			logger.info('arbiter: ensuring active subscription');

			await this.ensureActiveSubscriptionWithBackoff();

			logger.info('arbiter: subscription is active');

			status = {
				lastSuccessfulCheck: new Date().toISOString(),
				lastCheckError: null,
				lastCheck: new Date().toISOString(),
				status: true,
			};
		} catch (error) {
			logger.error('arbiter: subscription check failed', error);

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

					logger.error('arbiter: auth revoked');
					app.relaunch();
					app.exit();

					break;
				}

				default:
					logger.error('arbiter: unknown error case', squawk, error);

					break;
			}
		} finally {
			this.broadcastStatus(status);
			persistentStore.set('arbiter', status);
		}

		logger.info('arbiter: core status check over', status);

		if (status.status) {
			logger.info('arbiter: status check passed');

			return;
		}

		logger.info('arbiter: status check failed');

		nestClient.setAuth(null);

		logger.info('arbiter: closing windows and focusing on portal');

		const portalWindowId = createPortalWindow();

		TypedObject.values(windowStack).forEach(window => {
			if (window.id !== portalWindowId)
				window.close();
		});

		windowStack[portalWindowId].focus();
	}

	private async ensureActiveSubscriptionWithBackoff() {
		let latestError: unknown | null = null;

		for (let i = 0; i < 3; i++) {
			try {
				// eslint-disable-next-line no-await-in-loop
				await nestClient.ensureActiveSubscription();
			} catch (error) {
				logger.error('arbiter: ensure error caught during backoff', i, error);

				latestError = error;
			}
		}

		if (latestError)
			throw latestError;
	}

	private guardedCheck() {
		this.check().catch(error => logger.error('arbiter: check failure', error));
	}

	private broadcastStatus(status: ArbiterStatus) {
		logger.info('arbiter: broadcasting status to windows');

		TypedObject.values(windowStack).forEach(window => {
			if (!window || window.isDestroyed())
				return;

			logger.info('arbiter: broadcasting status');

			window.webContents.send('arbiter_broadcast', { code: 'status_update', payload: status });
		});
	}

	private startScheduler() {
		setInterval(async () => {
			try {
				this.guardedCheck();
			} catch (error) {
				logger.error('arbiter: guarded check failure', error);
			}
		}, 2_700_000); // 45 minutes
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
