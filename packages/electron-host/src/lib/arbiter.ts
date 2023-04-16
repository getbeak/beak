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

		logger.info('arbiter: skipping check, disabled');

		nestClient.setAuth(null);

		logger.info('arbiter: auth disabled');
	}

	private guardedCheck() {
		this.check().catch(error => logger.error('arbiter: check failure', error));
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

const arbiter = new Arbiter();

export default arbiter;
