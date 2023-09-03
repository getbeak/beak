import { Environment } from '@beak/common/types/beak';
import { app } from 'electron';

import getBeakHost from '../host';

export async function switchEnvironment(environment: Environment) {
	await getBeakHost().providers.storage.set('environment', environment);

	app.relaunch();
	app.exit();
}
