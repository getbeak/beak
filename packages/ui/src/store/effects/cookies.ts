import {
	type CookieEntry,
	type CookieJar,
	clearAllCookies,
	clearJar,
	clearJarItem,
	deleteCookie,
	hydrateCookieJars,
	parseSetCookie,
	renameJar,
	splitFoldedSetCookies,
	upsertCookie,
	upsertCookies,
} from '@beak/state/cookies';
import { completeFlight } from '@beak/state/flight';
import { projectOpened } from '@beak/state/project';
import { cookieJarFileSchema, emptyCookieJarFile, sealedCookieFileSchema } from '@beak/state/schemas';
import { ipcEncryptionService, ipcFsService } from '@beak/ui/lib/ipc';
import type { ApplicationState } from '@beak/ui/store';
import path from 'path-browserify';

import type { AppStartListening } from '../listener';

const COOKIES_FILE_PATH = path.join('.beak', 'cookies.sealed');
const SAVE_DEBOUNCE_MS = 600;
const MAX_COOKIES_PER_ITEM = 500;

let saveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Renderer-side persistence + hydration of `.beak/cookies.sealed`.
 *
 * The file is a sealed envelope (`{ v: 1, iv, ciphertext }`) wrapping
 * the JSON plaintext of `cookieJarFileSchema`. Encryption goes through
 * `ipcEncryptionService` — the same per-project AES-256-CTR key the
 * keychain holds for `secure:` / `private:` variable values. If the
 * encryption key isn't configured yet (`checkStatus() === false`) the
 * hydrate step yields an empty in-memory jar and writes are skipped;
 * mutations stay in memory until the user provides the key.
 *
 * On `projectOpened`: read + decrypt + validate + hydrate.
 * On any jar mutation: debounce-save the whole plaintext jar map.
 * Touches (`touchCookies`) intentionally don't trigger a save — the
 * `lastAccessed` field is a soft hint for LRU and we'd otherwise write
 * on every single outgoing request.
 */

function scheduleSave(getState: () => ApplicationState) {
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(() => {
		saveTimer = null;
		void persistNow(getState);
	}, SAVE_DEBOUNCE_MS);
}

async function persistNow(getState: () => ApplicationState) {
	const state = getState();
	const jars = state.global.cookies.jars;
	try {
		const ready = await ipcEncryptionService.checkStatus();
		if (!ready) {
			// Encryption not configured — keep the in-memory jar but skip the
			// sealed write so we never spill plaintext to disk.
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

function pruneAndCap(cookies: CookieEntry[], now: number): CookieEntry[] {
	const live = cookies.filter(c => typeof c.expires !== 'number' || c.expires > now);
	if (live.length <= MAX_COOKIES_PER_ITEM) return live;
	// LRU eviction: keep the most-recently-accessed entries.
	return [...live].sort((a, b) => b.lastAccessed - a.lastAccessed).slice(0, MAX_COOKIES_PER_ITEM);
}

export function registerCookieEffects(start: AppStartListening) {
	start({
		actionCreator: projectOpened,
		effect: async (_action, api) => {
			try {
				// First-open projects have no sealed file yet — short-circuit
				// before the read so the main process doesn't log a benign
				// ENOENT through its IPC error channel.
				if (!(await ipcFsService.pathExists(COOKIES_FILE_PATH))) {
					api.dispatch(hydrateCookieJars({ jars: emptyCookieJarFile().jars }));
					return;
				}
				const raw = (await ipcFsService.readJson<unknown>(COOKIES_FILE_PATH)) as unknown;
				if (!raw || (typeof raw === 'string' && raw.length === 0)) {
					api.dispatch(hydrateCookieJars({ jars: emptyCookieJarFile().jars }));
					return;
				}
				const envelope = sealedCookieFileSchema.safeParse(raw);
				if (!envelope.success) {
					console.warn('.beak/cookies.sealed envelope failed validation, ignoring', envelope.error);
					api.dispatch(hydrateCookieJars({ jars: emptyCookieJarFile().jars }));
					return;
				}
				const ready = await ipcEncryptionService.checkStatus();
				if (!ready) {
					// Encryption isn't ready yet — present an empty jar so the UI
					// renders, and DO NOT overwrite the sealed file. Once the user
					// provides their key, a re-open will hydrate properly.
					console.info('cookies hydrate skipped: encryption key not configured');
					api.dispatch(hydrateCookieJars({ jars: emptyCookieJarFile().jars }));
					return;
				}
				const plaintext = await ipcEncryptionService.decryptObject<unknown>({
					iv: envelope.data.iv,
					payload: envelope.data.ciphertext,
				});
				const parsed = cookieJarFileSchema.safeParse(plaintext);
				if (!parsed.success) {
					console.warn('cookies.sealed plaintext failed validation, ignoring', parsed.error);
					api.dispatch(hydrateCookieJars({ jars: emptyCookieJarFile().jars }));
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
				api.dispatch(hydrateCookieJars({ jars: cleaned }));
			} catch (error) {
				if ((error as { code?: string })?.code !== 'ENOENT') {
					console.warn('cookies hydrate failed', error);
				}
				api.dispatch(hydrateCookieJars({ jars: emptyCookieJarFile().jars }));
			}
		},
	});

	const mutators = [upsertCookie, upsertCookies, deleteCookie, clearJarItem, clearJar, clearAllCookies, renameJar];
	for (const actionCreator of mutators) {
		start({
			actionCreator,
			effect: (_action, api) => {
				scheduleSave(api.getState as () => ApplicationState);
			},
		});
	}

	// Capture Set-Cookie from completed responses. Runs after the slice has
	// finalised the flight entry into history, so we can read the resolved
	// URL straight off `response.url`.
	start({
		actionCreator: completeFlight,
		effect: (action, api) => {
			const state = api.getState() as ApplicationState;
			const captured = captureSetCookies(state, action.payload.response);
			for (const target of captured) {
				api.dispatch(
					upsertCookies({
						variableSet: target.variableSet,
						itemId: target.itemId,
						cookies: target.cookies,
					}),
				);
			}
		},
	});
}

interface CaptureTarget {
	variableSet: string;
	itemId: string;
	cookies: CookieEntry[];
}

function captureSetCookies(
	state: ApplicationState,
	response: { url: string; headers: Record<string, string> },
): CaptureTarget[] {
	const cookies = extractCookiesFromResponse(response);
	if (cookies.length === 0) return [];

	const target = pickOwningJar(state, cookies[0].domain);
	if (!target) return [];

	return [{ variableSet: target.variableSet, itemId: target.itemId, cookies }];
}

function extractCookiesFromResponse(response: { url: string; headers: Record<string, string> }): CookieEntry[] {
	let host = '';
	let requestPath = '/';
	try {
		const u = new URL(response.url);
		host = u.hostname;
		requestPath = u.pathname || '/';
	} catch {
		return [];
	}

	// Mint the creation/lastAccessed timestamp once here, at dispatch-prep time,
	// so every cookie in this response batch shares the same epoch and the value
	// never originates inside a reducer (ADR 0005 §2).
	const now = Date.now();
	const out: CookieEntry[] = [];
	for (const [name, value] of Object.entries(response.headers)) {
		if (name.toLowerCase() !== 'set-cookie') continue;
		// fetch/node may fold multiple Set-Cookie headers into a single value;
		// `splitFoldedSetCookies` puts them back into individual cookie strings.
		const candidates = splitFoldedSetCookies(value);
		for (const raw of candidates) {
			const cookie = parseSetCookie(raw, { requestHost: host, requestPath, now });
			if (cookie) out.push(cookie);
		}
	}
	return out;
}

/**
 * Pick the variable-set jar (and currently-selected item) that should
 * receive these Set-Cookie entries. Heuristic:
 *
 * Set-Cookie always deposits into the project's primary cookie jar
 * (configured via `project.json` → `cookies.primaryVariableSet`,
 * defaults to `'Environment'`). Earlier this was a domain-matching
 * heuristic that could pick *any* variable-set jar, which made
 * incoming cookies feel non-deterministic — same host could land in
 * different jars depending on what was already inside them. The
 * primary jar is the deliberate "ambient" jar, so it owns Set-Cookie.
 *
 * Returns null only when the primary jar has no selected item (the
 * user hasn't picked an environment yet); cookies are dropped in that
 * case rather than guessed at.
 *
 * `_cookieDomain` is unused now but kept on the signature so the
 * caller doesn't have to thread changes — and future logic that wants
 * to honour, say, a `cookieDomainOverrides` config knows where to
 * look.
 */
function pickOwningJar(state: ApplicationState, _cookieDomain: string): { variableSet: string; itemId: string } | null {
	const projectCookies = state.global.project.cookies;
	const selections = state.global.preferences.editor.selectedVariableSets ?? {};
	const variableSets = state.global.variableSets.variableSets ?? {};
	const variableSetNames = Object.keys(variableSets);

	const requestedPrimary = projectCookies?.primaryVariableSet;
	const primary =
		requestedPrimary && variableSets[requestedPrimary]
			? requestedPrimary
			: variableSetNames.includes('Environment')
				? 'Environment'
				: variableSetNames.sort()[0];

	if (!primary) return null;
	const itemId = selections[primary];
	if (!itemId) return null;
	return { variableSet: primary, itemId };
}
