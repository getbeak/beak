import BeakHost from '@beak/common-host';
import FS from '@isomorphic-git/lightning-fs';
import base64 from 'base64-js';
import path from 'path-browserify';
import { Logger } from 'tslog';

import AesProvider from './providers/aes';
import CredentialsProvider from './providers/credentials';
import StorageProvider from './providers/storage';

const beakHostLogger = new Logger({ name: 'web-host' });
const beakBrowserFs = new FS('beak');

const beakHost = new BeakHost({
	aes: new AesProvider(),
	logger: beakHostLogger,
	credentials: new CredentialsProvider(),
	storage: new StorageProvider({
		recents: [],
		windowStates: {},
		previousWindowPresence: [],
		beakId: base64.fromByteArray(window.crypto.getRandomValues(new Uint8Array(128))),

		latestKnownVersion: '2.0.0',
		environment: 'prod',

		encryptedAuth: null,

		referenceFiles: {},

		notifications: {
			onSuccessfulRequest: 'sound-only',
			onInformationRequest: 'on',
			onFailedRequest: 'on',
			showRequestNotificationWhenFocused: false,

			onUpdateAvailable: 'on',
		},

		editor: {
			fontSize: 11,
			themeOverride: 'system',
		},

		passedOnboarding: false,
		projectMappings: {},

		themeMode: 'system',
	}),
	node: {
		// @ts-expect-error
		fs: beakBrowserFs,
		path,
	},
});

export default function getBeakHost() {
	return beakHost;
}
