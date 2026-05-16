import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import Runtime from '@beak/runtime-shared';
import { app } from 'electron';
import gitHttp from 'isomorphic-git/http/node';
import { Logger } from 'tslog';

import { setupLoggerForFsLogging } from '../lib/logger';
import AesProvider from './providers/aes';
import CredentialsProvider from './providers/credentials';
import StorageProvider from './providers/storage';

const beakHostLogger = new Logger({ name: 'electron-host' });

setupLoggerForFsLogging(beakHostLogger, 'main');

const runtime = new Runtime({
	capabilities: {
		nativeContextMenus: true,
		extensions: true,
		multipleWindows: true,
		systemKeychain: true,
		fileSystemAccess: 'native',
		binaryStreaming: true,
	},
	providers: {
		aes: new AesProvider(),
		logger: beakHostLogger,
		credentials: new CredentialsProvider(),
		storage: new StorageProvider({
			recents: [],
			windowStates: {},
			previousWindowPresence: [],
			beakId: crypto.randomBytes(128).toString('base64url'),

			latestKnownVersion: app.getVersion(),
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
			fs,
			path,
		},
		git: {
			http: gitHttp,
		},
	},
});

export default function getRuntime() {
	return runtime;
}

/** @deprecated use {@link getRuntime}. Kept during the migration. */
export const getBeakHost = getRuntime;
