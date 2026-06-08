import type { CookieEntry, CookieJar } from '@beak/state/cookies';
import { hydrateCookieJars } from '@beak/state/cookies';
import { cookieJarFileSchema, emptyCookieJarFile, sealedCookieFileSchema } from '@beak/state/schemas';
import { ipcEncryptionService, ipcFsService } from '@beak/ui/lib/ipc';
import type { ApplicationState } from '@beak/ui/store';
import type { Dispatch } from 'redux';

const COOKIES_FILE_PATH = '.beak/cookies.sealed';
const MAX_COOKIES_PER_ITEM = 500;

/**
 * Persist the current in-memory cookie jars to `.beak/cookies.sealed`.
 *
 * The file is a sealed envelope (`{ v: 1, iv, ciphertext }`) wrapping
 * the JSON plaintext of `cookieJarFileSchema`. Encryption goes through
 * `ipcEncryptionService`. If the encryption key isn't configured yet
 * (`checkStatus() === false`) the write is skipped so plaintext never
 * spills to disk; mutations stay in memory until the user provides the key.
 */
export async function persistCookieJars(getState: () => ApplicationState): Promise<void> {
	const state = getState();
	const jars = state.global.cookies.jars;
	try {
		const ready = await ipcEncryptionService.checkStatus();
		if (!ready) {
			console.warn('cookies persist skipped: encryption key not configured');
			return;
		}
		const file = buildPersistedFile(jars);
		const iv = await ipcEncryptionService.generateIv();
		const ciphertext = await ipcEncryptionService.encryptObject({ payload: file, iv });
		const envelope = { v: 1 as const, iv, ciphertext };
		await ipcFsService.writeJson(COOKIES_FILE_PATH, envelope, { spaces: '\t' });
	} catch (error) {
		console.warn('cookies persist failed', error);
	}
}

/**
 * Read, decrypt, validate, and hydrate the cookie jars from
 * `.beak/cookies.sealed`. Dispatches `hydrateCookieJars` with the
 * loaded state, falling back to an empty jar on any failure so the UI
 * renders cleanly.
 *
 * On first-open (no sealed file yet), the check is short-circuited
 * before the read so the main process doesn't log a benign ENOENT
 * through its IPC error channel.
 *
 * If the encryption key isn't ready yet, presents an empty jar without
 * overwriting the sealed file — a re-open after key provision will
 * hydrate properly.
 */
export async function loadAndHydrateCookies(dispatch: Dispatch): Promise<void> {
	try {
		if (!(await ipcFsService.pathExists(COOKIES_FILE_PATH))) {
			dispatch(hydrateCookieJars({ jars: emptyCookieJarFile().jars }));
			return;
		}
		const raw = (await ipcFsService.readJson<unknown>(COOKIES_FILE_PATH)) as unknown;
		if (!raw || (typeof raw === 'string' && raw.length === 0)) {
			dispatch(hydrateCookieJars({ jars: emptyCookieJarFile().jars }));
			return;
		}
		const envelope = sealedCookieFileSchema.safeParse(raw);
		if (!envelope.success) {
			console.warn('.beak/cookies.sealed envelope failed validation, ignoring', envelope.error);
			dispatch(hydrateCookieJars({ jars: emptyCookieJarFile().jars }));
			return;
		}
		const ready = await ipcEncryptionService.checkStatus();
		if (!ready) {
			console.info('cookies hydrate skipped: encryption key not configured');
			dispatch(hydrateCookieJars({ jars: emptyCookieJarFile().jars }));
			return;
		}
		const plaintext = await ipcEncryptionService.decryptObject<unknown>({
			iv: envelope.data.iv,
			payload: envelope.data.ciphertext,
		});
		const parsed = cookieJarFileSchema.safeParse(plaintext);
		if (!parsed.success) {
			console.warn('cookies.sealed plaintext failed validation, ignoring', parsed.error);
			dispatch(hydrateCookieJars({ jars: emptyCookieJarFile().jars }));
			return;
		}
		const now = Date.now();
		const cleaned: Record<string, CookieJar> = {};
		for (const [variableSet, jar] of Object.entries(parsed.data.jars)) {
			const built: CookieJar = {};
			for (const [itemId, cookies] of Object.entries(jar)) {
				const pruned = pruneAndCap(cookies, now);
				if (pruned.length > 0) built[itemId] = pruned;
			}
			if (Object.keys(built).length > 0) cleaned[variableSet] = built;
		}
		dispatch(hydrateCookieJars({ jars: cleaned }));
	} catch (error) {
		if ((error as { code?: string })?.code !== 'ENOENT') {
			console.warn('cookies hydrate failed', error);
		}
		dispatch(hydrateCookieJars({ jars: emptyCookieJarFile().jars }));
	}
}

/**
 * Prune expired cookies from a jar before persisting, and cap at
 * `MAX_COOKIES_PER_ITEM` via LRU eviction.
 */
export function pruneAndCap(cookies: CookieEntry[], now: number): CookieEntry[] {
	const live = cookies.filter(c => typeof c.expires !== 'number' || c.expires > now);
	if (live.length <= MAX_COOKIES_PER_ITEM) return live;
	return [...live].sort((a, b) => b.lastAccessed - a.lastAccessed).slice(0, MAX_COOKIES_PER_ITEM);
}

function buildPersistedFile(jars: Record<string, CookieJar>) {
	const out: Record<string, CookieJar> = {};
	const now = Date.now();
	for (const [variableSet, jar] of Object.entries(jars)) {
		const cleaned: CookieJar = {};
		for (const [itemId, cookies] of Object.entries(jar)) {
			const filtered = pruneAndCap(cookies, now);
			if (filtered.length > 0) cleaned[itemId] = filtered;
		}
		if (Object.keys(cleaned).length > 0) out[variableSet] = cleaned;
	}
	return { version: 1 as const, jars: out };
}
