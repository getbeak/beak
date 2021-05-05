import { TypedObject } from '@beak/common/helpers/typescript';
import Squawk from '@beak/common/utils/squawk';

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
		const auth = nestClient.getAuth();
		let status = this.getStatus();

		if (!auth)
			return;

		try {
			await nestClient.ensureAlphaUser();

			status = {
				lastSuccessfulCheck: new Date().toISOString(),
				lastCheckError: null,
				lastCheck: new Date().toISOString(),
				status: true,
			};
		} catch (error) {
			const squawk = Squawk.coerce(error);

			status = {
				lastSuccessfulCheck: status.lastSuccessfulCheck,
				lastCheckError: squawk,
				lastCheck: new Date().toISOString(),
				status: true,
			};

			if (squawk.code !== 'unknown') {
				nestClient.setAuth(null);

				status.status = false;
			}

			console.error(error);
		}

		persistentStore.set('arbiter', status);

		// TODO(afr): If status is false, or it's been over 7 days since last check, then we need to close all open
		// windows and show onboarding here

		TypedObject.values(windowStack).forEach(window => {
			if (!window)
				return;

			window.webContents.send('arbiter_broadcast', { code: 'status_update', payload: status });
		});
	}
}

const arbiter = new Arbiter();

export default arbiter;
