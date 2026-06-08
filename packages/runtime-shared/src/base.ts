import type fs from 'node:fs';
import type path from 'node:path';
import type { HttpClient } from 'isomorphic-git';
import type { Logger } from 'tslog';

import type CredentialsProvider from './ports/credentials';
import type AesProvider from './ports/encryption-aes';
import type PreferencesStore from './ports/preferences-store';
import type ProjectOpener from './ports/project-opener';
import type StorageProvider from './ports/storage';
import type { GenericStore } from './ports/storage';

/**
 * Capabilities matrix advertised by a concrete runtime. Renderer features
 * gate on these flags instead of branching on `if (electron)`.
 */
export interface RuntimeCapabilities {
	/** Native OS context menus (Electron). Web falls back to DOM menus. */
	nativeContextMenus: boolean;
	/** Loading and executing RTV extension code in a sandbox. Electron-only today. */
	extensions: boolean;
	/** Multiple OS windows. Web is single-window, uses tabs. */
	multipleWindows: boolean;
	/** Credentials stored in the OS keychain instead of in-process storage. */
	systemKeychain: boolean;
	/** Native FS vs sandboxed (e.g. lightning-fs over IndexedDB). */
	fileSystemAccess: 'native' | 'sandboxed';
	/** True if request/response binary bodies can stream incrementally. */
	binaryStreaming: boolean;
	/**
	 * Can this host route flights through a local agent process?
	 *
	 *   'unsupported' — host has its own request execution. Renderer skips
	 *                   all agent UI and state.
	 *   'optional'    — host can use a paired agent if one is reachable,
	 *                   falls back to its default path otherwise.
	 *   'required'    — host has no other way to fire requests. Renderer
	 *                   forces pair-or-fail UI.
	 *
	 * See docs/adr/0001-local-agent-for-web-host.md.
	 */
	localAgent: 'unsupported' | 'optional' | 'required';
}

/**
 * Optional Git provider — each host wires the right HTTP transport and an
 * optional default CORS proxy. Local-only operations work without it; only
 * network ops (clone/push/pull/fetch) require `http`.
 */
export interface GitProvider {
	http: HttpClient;
	corsProxy?: string;
}

export interface Providers {
	aes: AesProvider;
	credentials: CredentialsProvider;
	logger: Logger<unknown>;
	preferences: PreferencesStore;
	projectOpener: ProjectOpener;
	storage: StorageProvider<GenericStore>;

	node: {
		fs: typeof fs;
		path: typeof path;
	};

	git?: GitProvider;
}

export interface RuntimeOptions {
	providers: Providers;
	capabilities: RuntimeCapabilities;
	/**
	 * Host-provided clipboard writer. Electron passes `(t) => clipboard.writeText(t)`;
	 * web passes `(t) => navigator.clipboard.writeText(t)`. Abstracted here so
	 * `ProjectSecrets` (shared concrete in `runtime-shared`) doesn't depend on either
	 * host's platform API directly.
	 */
	writeToClipboard: (text: string) => Promise<void>;
}

/**
 * Common base for any class that needs the providers handle. Used by
 * `Runtime` itself and by per-domain helpers (project, extensions, …).
 */
export class RuntimeBase {
	readonly providers: Providers;

	get p() {
		return this.providers;
	}

	constructor(providers: Providers) {
		this.providers = providers;
	}
}

/** @deprecated use {@link RuntimeBase}. Kept as an alias during the migration. */
export const BeakBase = RuntimeBase;
/** @deprecated use {@link RuntimeBase}. Kept as an alias during the migration. */
export type BeakBase = RuntimeBase;
