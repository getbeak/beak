import { TypedObject } from '@beak/common/helpers/typescript';
import { ArbiterStatus } from '@beak/common/types/arbiter';

import { windowStack } from '../window-management';
import nestClient from './nest-client';
import persistentStore from './persistent-store';

class Arbiter {
	start() {
		// TODO(afr): Change this back to 15 minutes
		setInterval(() => this.check().catch(console.error), 30000);
	}

	getStatus() {
		return persistentStore.get('arbiter');
	}

	async check() {
		const auth = persistentStore.get('auth');
		let status = this.getStatus();

		if (!auth)
			return;

		try {
			await nestClient.ensureAlphaUser();

			status = {
				lastSuccessfulCheck: new Date().toISOString(),
				lastCheck: new Date().toISOString(),
				status: true,
			};
		} catch (error) {
			status = {
				lastSuccessfulCheck: status.lastSuccessfulCheck,
				lastCheck: new Date().toISOString(),
				status: false,
			};

			console.error(error);
		}

		persistentStore.set('arbiter', status);

		TypedObject.values(windowStack).forEach(window => {
			if (!window)
				return;

			window.webContents.send('arbiter_broadcast', { code: 'status_update', payload: status });
		});
	}
}

const arbiter = new Arbiter();

export default arbiter;
