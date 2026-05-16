import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { filterCookiesForRequest, serialiseCookieHeader } from './matching';
import { type CookieEntry, type CookieJar, type CookieSliceState, initialCookieState } from './types';

/**
 * Per-project cookie jars, partitioned by `(variableSetName, itemId)`
 * so cookies from different environments (dev/staging/prod) don't
 * cross-contaminate. The slice is the single source of truth in
 * memory; the persistence effect reads + writes a sealed file under
 * `.beak/cookies.sealed`.
 */

interface CookieIdentity {
	name: string;
	domain: string;
	path: string;
}

function sameIdentity(a: CookieIdentity, b: CookieIdentity): boolean {
	return a.name === b.name && a.domain === b.domain && a.path === b.path;
}

function ensureJar(state: CookieSliceState, variableSet: string): CookieJar {
	let jar = state.jars[variableSet];
	if (!jar) {
		jar = {};
		state.jars[variableSet] = jar;
	}
	return jar;
}

function ensureItem(state: CookieSliceState, variableSet: string, itemId: string): CookieEntry[] {
	const jar = ensureJar(state, variableSet);
	if (!jar[itemId]) jar[itemId] = [];
	return jar[itemId];
}

const cookiesSlice = createSlice({
	name: 'cookies',
	initialState: initialCookieState,
	reducers: {
		/** Bulk-load from disk after `.beak/cookies.sealed` is decrypted. */
		hydrateCookieJars: (state, action: PayloadAction<{ jars: Record<string, CookieJar> }>) => {
			state.jars = action.payload.jars;
			state.loaded = true;
		},
		/**
		 * Upsert a single cookie into a (variableSet, item) bucket. Identity is
		 * `(name, domain, path)` per RFC 6265 §5.3; an existing entry with the
		 * same identity is replaced but its `creation` timestamp is preserved.
		 */
		upsertCookie: (
			state,
			action: PayloadAction<{
				variableSet: string;
				itemId: string;
				cookie: CookieEntry;
			}>,
		) => {
			const { variableSet, itemId, cookie } = action.payload;
			const list = ensureItem(state, variableSet, itemId);
			const existingIndex = list.findIndex(c => sameIdentity(c, cookie));
			if (existingIndex >= 0) {
				const existing = list[existingIndex];
				list[existingIndex] = { ...cookie, creation: existing.creation };
			} else {
				list.push(cookie);
			}
		},
		/**
		 * Apply many cookies at once — fast path for capturing all Set-Cookie
		 * headers from a single response.
		 */
		upsertCookies: (
			state,
			action: PayloadAction<{
				variableSet: string;
				itemId: string;
				cookies: CookieEntry[];
			}>,
		) => {
			const { variableSet, itemId, cookies } = action.payload;
			const list = ensureItem(state, variableSet, itemId);
			for (const cookie of cookies) {
				const existingIndex = list.findIndex(c => sameIdentity(c, cookie));
				if (existingIndex >= 0) {
					const existing = list[existingIndex];
					list[existingIndex] = { ...cookie, creation: existing.creation };
				} else {
					list.push(cookie);
				}
			}
		},
		deleteCookie: (
			state,
			action: PayloadAction<{
				variableSet: string;
				itemId: string;
				name: string;
				domain: string;
				path: string;
			}>,
		) => {
			const { variableSet, itemId, name, domain, path } = action.payload;
			const list = state.jars[variableSet]?.[itemId];
			if (!list) return;
			state.jars[variableSet][itemId] = list.filter(c => !(c.name === name && c.domain === domain && c.path === path));
		},
		clearJarItem: (state, action: PayloadAction<{ variableSet: string; itemId: string }>) => {
			const { variableSet, itemId } = action.payload;
			if (state.jars[variableSet]) delete state.jars[variableSet][itemId];
		},
		clearJar: (state, action: PayloadAction<{ variableSet: string }>) => {
			delete state.jars[action.payload.variableSet];
		},
		clearAllCookies: state => {
			state.jars = {};
		},
		/** Variable-set rename: move the jar to a new key without losing entries. */
		renameJar: (state, action: PayloadAction<{ from: string; to: string }>) => {
			const { from, to } = action.payload;
			if (from === to) return;
			const jar = state.jars[from];
			if (!jar) return;
			state.jars[to] = jar;
			delete state.jars[from];
		},
		/**
		 * Tick last-accessed timestamps for cookies that just rode an outgoing
		 * request — keeps the LRU eviction policy honest.
		 */
		touchCookies: (
			state,
			action: PayloadAction<{
				variableSet: string;
				itemId: string;
				keys: { name: string; domain: string; path: string }[];
				now?: number;
			}>,
		) => {
			const { variableSet, itemId, keys, now } = action.payload;
			const list = state.jars[variableSet]?.[itemId];
			if (!list) return;
			const ts = now ?? Date.now();
			for (const cookie of list) {
				if (keys.some(k => sameIdentity(cookie, k))) cookie.lastAccessed = ts;
			}
		},
	},
});

export const {
	hydrateCookieJars,
	upsertCookie,
	upsertCookies,
	deleteCookie,
	clearJarItem,
	clearJar,
	clearAllCookies,
	renameJar,
	touchCookies,
} = cookiesSlice.actions;

export default cookiesSlice.reducer;

// -- selectors --

interface CookiesRootState {
	global: { cookies: CookieSliceState };
}

export const selectCookiesLoaded = (state: CookiesRootState) => state.global.cookies.loaded;

export const selectAllCookieJars = (state: CookiesRootState) => state.global.cookies.jars;

export const selectCookieJar = (variableSet: string) => (state: CookiesRootState) =>
	state.global.cookies.jars[variableSet] ?? {};

/**
 * For a flight outgoing to `(scheme, host, path)`, collect the cookies
 * that should ride along across every enabled variable-set jar's
 * currently-selected item. Caller passes the resolved per-variable-set
 * item selections (`preferences.editor.selectedVariableSets`).
 */
export function selectOutgoingCookies(
	state: CookiesRootState,
	selections: Record<string, string | undefined>,
	scheme: string,
	host: string,
	path: string,
): {
	cookies: CookieEntry[];
	header: string;
	perJar: { variableSet: string; itemId: string; cookies: CookieEntry[] }[];
} {
	const perJar: { variableSet: string; itemId: string; cookies: CookieEntry[] }[] = [];
	const all: CookieEntry[] = [];
	for (const [variableSet, jar] of Object.entries(state.global.cookies.jars)) {
		const itemId = selections[variableSet];
		if (!itemId) continue;
		const list = jar[itemId];
		if (!list?.length) continue;
		const matched = filterCookiesForRequest({ cookies: list, scheme, host, path });
		if (matched.length === 0) continue;
		perJar.push({ variableSet, itemId, cookies: matched });
		all.push(...matched);
	}
	all.sort((a, b) => {
		if (a.path.length !== b.path.length) return b.path.length - a.path.length;
		return a.creation - b.creation;
	});
	return { cookies: all, header: serialiseCookieHeader(all), perJar };
}
