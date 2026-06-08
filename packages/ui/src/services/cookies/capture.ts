import type { CookieEntry } from '@beak/state/cookies';
import { parseSetCookie, splitFoldedSetCookies } from '@beak/state/cookies';
import type { ApplicationState } from '@beak/ui/store';

import { pickOwningJar } from './jar-picker';

export interface CaptureTarget {
	variableSet: string;
	itemId: string;
	cookies: CookieEntry[];
}

/**
 * Parse Set-Cookie headers from a completed flight response and map them
 * onto the appropriate cookie jar target.
 *
 * Returns an array of `CaptureTarget` objects — one per jar that should
 * receive cookies. In practice this is 0 (no Set-Cookie / no active
 * environment selected) or 1 (primary jar receives all inbound cookies).
 */
export function captureSetCookies(
	state: ApplicationState,
	response: { url: string; headers: Record<string, string> },
): CaptureTarget[] {
	const cookies = extractCookiesFromResponse(response);
	if (cookies.length === 0) return [];

	const target = pickOwningJar(state, cookies[0].domain);
	if (!target) return [];

	return [{ variableSet: target.variableSet, itemId: target.itemId, cookies }];
}

/**
 * Parse the raw Set-Cookie header(s) from a response into structured
 * `CookieEntry` objects.
 *
 * The `now` timestamp is minted once per call so every cookie in the
 * batch shares the same creation/lastAccessed epoch — values must never
 * originate inside a reducer (ADR 0005 §2).
 */
export function extractCookiesFromResponse(response: { url: string; headers: Record<string, string> }): CookieEntry[] {
	let host = '';
	let requestPath = '/';
	try {
		const u = new URL(response.url);
		host = u.hostname;
		requestPath = u.pathname || '/';
	} catch {
		return [];
	}

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
