import Runtime from '@beak/runtime-shared';
import FS from '@isomorphic-git/lightning-fs';
import base64 from 'base64-js';
import gitHttp from 'isomorphic-git/http/web';
import path from 'path-browserify';
import { Logger } from 'tslog';

import AesProvider from './providers/aes';
import CredentialsProvider from './providers/credentials';
import StorageProvider from './providers/storage';

const beakHostLogger = new Logger({ name: 'web-host' });
const beakBrowserFs = new FS('beak');

const runtime = new Runtime({
	capabilities: {
		nativeContextMenus: false,
		extensions: false,
		multipleWindows: false,
		systemKeychain: false,
		fileSystemAccess: 'sandboxed',
		binaryStreaming: false,
	},
	providers: {
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
			// @ts-expect-error path-browserify lacks the full node:path surface (matchesGlob, toNamespacedPath) — fine for renderer.
			fs: beakBrowserFs,
			// @ts-expect-error see above
			path,
		},
		git: {
			http: gitHttp,
			// Public dev CORS proxy. Production should swap for a self-hosted
			// proxy (a few-line Cloudflare Worker is enough); see Phase 5 wiring
			// for the per-call override.
			corsProxy: 'https://cors.isomorphic-git.org',
		},
	},
});

export default function getRuntime() {
	return runtime;
}

/** @deprecated use {@link getRuntime}. Kept during the migration. */
export const getBeakHost = getRuntime;
