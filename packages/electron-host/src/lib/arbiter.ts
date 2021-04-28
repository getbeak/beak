import { TypedObject } from '@beak/common/helpers/typescript';
import { ArbiterStatus } from '@beak/common/types/arbiter';

import { windowStack } from '../window-management';
import nestClient from './nest-client';
import persistentStore from './persistent-store';

class Arbiter {
	start() {
		setInterval(() => this.check().catch(console.error), 900000);
	}

	getStatus() {
		return persistentStore.get('arbiter');
	}

	async check() {
		const auth = persistentStore.get('auth');
		let status: ArbiterStatus;

		if (!auth)
			return;

		try {
			await nestClient.ensureAlphaUser();

			status = {
				lastCheck: new Date().toISOString(),
				status: true,
			};
		} catch (error) {
			status = {
				lastCheck: new Date().toISOString(),
				status: false,
			};

			console.error(error);
		}

		persistentStore.set('arbiter', status);

		TypedObject.values(windowStack).forEach(window => {
			if (!window)
				return;

			window.webContents.send('arbiter', { code: 'check_update', payload: status });
		});
	}
}

const arbiter = new Arbiter();

export default arbiter;
