import Squawk from '@beak/squawk';
import { dialog } from 'electron';

import logger from './logger';
import nestClient from './nest-client';
import persistentStore from './persistent-store';

export async function attemptMarketingConsentScreen() {
	const passedOnboarding = persistentStore.get('passedOnboarding');

	if (!passedOnboarding)
		return;

	try {
		await nestClient.getMarketingConsent();

		// TODO(afr): Later on, ask again after x time if they select no

		return;
	} catch (error) {
		const squawk = Squawk.coerce(error);

		if (squawk.code !== 'awaiting_consent') {
			logger.error('unknown error getting marketing consent', error);

			return;
		}
	}

	const { response } = await dialog.showMessageBox({
		type: 'info',
		title: 'Review marketing permissions',
		message: 'Can we send you relevant emails about Beak? This will include new features, beta invites, and feedback.',
		detail: `
Beak is built for developers, by developers. We won't ever spam you or sell your data.
`.trim(),
		buttons: ['Not now', 'Sure', 'No thanks'],
		cancelId: 0,
		defaultId: 1,
	});

	if (response === 0)
		return;

	try {
		await nestClient.setMarketingConsent(response === 1 ? 'general' : 'none');
	} catch (error) {
		logger.error('unknown error setting marketing consent', error);
	}
}
