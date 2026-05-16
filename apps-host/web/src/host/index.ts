import Runtime from '@beak/runtime-shared';
import base64 from 'base64-js';
import gitHttp from 'isomorphic-git/http/web';
import path from 'path-browserify';
import { Logger } from 'tslog';

import OpfsFs from './opfs-fs';
import AesProvider from './providers/aes';
import CredentialsProvider from './providers/credentials';
import StorageProvider from './providers/storage';

const beakHostLogger = new Logger({ name: 'web-host' });

/**
 * Beak's web shell runs on OPFS — no lightning-fs / IndexedDB fallback.
 * Browsers without OPFS (private mode in some configurations, very old
 * Safari, etc.) get a "browser not supported" boot error rather than a
 * slow IndexedDB path that timed out commits at 10+ seconds per file.
 */
if (typeof navigator === 'undefined' || typeof navigator.storage?.getDirectory !== 'function') {
	throw new Error(
		'Beak (web) needs the Origin Private File System (OPFS). Your browser doesn’t expose it — try Chrome 86+, Edge 86+, Firefox 111+ or Safari 17+, and disable private browsing if it’s on.',
	);
}

const beakBrowserFs = new OpfsFs('beak');

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
