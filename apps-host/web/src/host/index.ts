import Runtime from '@beak/runtime-shared';
import base64 from 'base64-js';
import gitHttp from 'isomorphic-git/http/web';
import path from 'path-browserify';
import { Logger } from 'tslog';

import WebProjectOpener from '../adapters/project-opener';
import { checkHandlePermission, loadHandle } from './fsa-handle-storage';
import OpfsFs from './opfs-fs';
import AesProvider from './providers/aes';
import CredentialsProvider from './providers/credentials';
import WebPreferencesStore from './providers/preferences-store';
import StorageProvider from './providers/storage';

const beakHostLogger = new Logger({ name: 'web-host' });

/**
 * Beak's web shell runs on OPFS — no lightning-fs / IndexedDB fallback.
 * If the user has picked a real folder via the File System Access API
 * (welcome screen → Open existing), the host mounts that folder as the
 * fs root instead and OPFS is unused for the session.
 *
 * Browsers without OPFS (private mode in some configurations, very old
 * Safari, etc.) get a "browser not supported" boot error rather than a
 * slow IndexedDB path that timed out commits at 10+ seconds per file.
 */
if (typeof navigator === 'undefined' || typeof navigator.storage?.getDirectory !== 'function') {
	throw new Error(
		'Beak (web) needs the Origin Private File System (OPFS). Your browser doesn’t expose it — try Chrome 86+, Edge 86+, Firefox 111+ or Safari 17+, and disable private browsing if it’s on.',
	);
}

/**
 * Tracks whether the fs root is the OPFS namespace (the default sandbox)
 * or a user-picked folder mounted via the File System Access API. The flag
 * is set inside `resolveFsRoot` as the boot promise settles. IPC handlers
 * read it through `getRootMode()` to decide how to interpret paths and
 * which recents to surface.
 *
 * Synchronous reads are safe in practice because boot resolves long before
 * the renderer dispatches its first IPC — but if you ever need to gate a
 * very-early operation on a guaranteed value, await `rootModeReady`.
 */
export type RootMode = 'opfs' | 'fsa';

let currentRootMode: RootMode = 'opfs';

/**
 * Resolve the fs root: a previously-picked FSA folder if the user has
 * one *and* still has read+write permission, otherwise the OPFS subdir.
 *
 * `requestPermission` would force a user gesture, but boot doesn't have
 * one — so we silently fall back to OPFS when permission has lapsed.
 * The user can re-pick from the welcome screen if they want.
 */
async function resolveFsRoot(): Promise<FileSystemDirectoryHandle> {
	const saved = await loadHandle();
	if (saved && (await checkHandlePermission(saved))) {
		currentRootMode = 'fsa';
		return saved;
	}
	currentRootMode = 'opfs';
	const root = await navigator.storage.getDirectory();
	return root.getDirectoryHandle('beak', { create: true });
}

const fsRootPromise = resolveFsRoot();
const beakBrowserFs = new OpfsFs(fsRootPromise);

export function getRootMode(): RootMode {
	return currentRootMode;
}

export const rootModeReady: Promise<RootMode> = fsRootPromise.then(() => currentRootMode);

const storageProvider = new StorageProvider({
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
});

const runtime = new Runtime({
	writeToClipboard: async text => navigator.clipboard.writeText(text),
	capabilities: {
		nativeContextMenus: false,
		extensions: true,
		multipleWindows: false,
		systemKeychain: false,
		fileSystemAccess: 'sandboxed',
		binaryStreaming: false,
		localAgent: 'optional',
	},
	providers: {
		aes: new AesProvider(),
		logger: beakHostLogger,
		credentials: new CredentialsProvider(),
		preferences: new WebPreferencesStore(storageProvider),
		projectOpener: new WebProjectOpener(),
		storage: storageProvider,
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
