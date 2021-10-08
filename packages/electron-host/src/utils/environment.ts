import { app } from 'electron';

import nestClient from '../lib/nest-client';
import persistentStore, { Environment } from '../lib/persistent-store';

export async function switchEnvironment(environment: Environment) {
	persistentStore.set('environment', environment);

	await nestClient.setAuth(null);

	app.relaunch();
	app.exit();
}
