import type { CookieEntry, CookieSameSite } from './types';

/**
 * Loose RFC 6265 §5.2 parser for a single `Set-Cookie` header value.
 * The header is the cookie pair (`name=value`) followed by zero or
 * more semicolon-separated attributes. Unknown attributes are
 * tolerated (logged to caller if it wants to), invalid dates are
 * dropped, and `Max-Age` wins over `Expires` per §5.3 step 3.
 *
 * Returns null when the cookie pair is malformed (no `=`, empty name).
 */
export interface ParseSetCookieContext {
	/** Request host — used to default `domain` for host-only cookies. */
	requestHost: string;
	/** Request URL path — used to default `path` per §5.1.4. */
	requestPath: string;
	/** Epoch ms; injectable for tests. Defaults to `Date.now()`. */
	now?: number;
}

export function parseSetCookie(raw: string, ctx: ParseSetCookieContext): CookieEntry | null {
	const now = ctx.now ?? Date.now();
	const parts = splitAttributes(raw);
	if (parts.length === 0) return null;

	const [pair, ...attrs] = parts;
	const eq = pair.indexOf('=');
	if (eq <= 0) return null;
	const name = pair.slice(0, eq).trim();
	if (!name) return null;
	const value = pair.slice(eq + 1).trim();

	let domain: string | undefined;
	let path: string | undefined;
	let expires: number | undefined;
	let maxAgeSeconds: number | undefined;
	let secure = false;
	let httpOnly = false;
	let sameSite: CookieSameSite | undefined;

	for (const attr of attrs) {
		const sep = attr.indexOf('=');
		const key = (sep < 0 ? attr : attr.slice(0, sep)).trim().toLowerCase();
		const val = sep < 0 ? '' : attr.slice(sep + 1).trim();
		switch (key) {
			case 'domain':
				if (val) {
					let d = val.toLowerCase();
					if (d.startsWith('.')) d = d.slice(1);
					if (d) domain = d;
				}
				break;
			case 'path':
				if (val.startsWith('/')) path = val;
				break;
			case 'expires': {
				const ts = Date.parse(val);
				if (!Number.isNaN(ts)) expires = ts;
				break;
			}
			case 'max-age': {
				const n = Number.parseInt(val, 10);
				if (Number.isFinite(n)) maxAgeSeconds = n;
				break;
			}
			case 'secure':
				secure = true;
				break;
			case 'httponly':
				httpOnly = true;
				break;
			case 'samesite': {
				const lower = val.toLowerCase();
				if (lower === 'strict') sameSite = 'Strict';
				else if (lower === 'lax') sameSite = 'Lax';
				else if (lower === 'none') sameSite = 'None';
				break;
			}
		}
	}

	// RFC 6265 §5.3 step 3: Max-Age beats Expires. Max-Age <= 0 yields an
	// already-expired cookie (servers use this to delete).
	let effectiveExpires: number | undefined;
	if (maxAgeSeconds !== undefined) effectiveExpires = now + maxAgeSeconds * 1000;
	else if (expires !== undefined) effectiveExpires = expires;

	const hostOnly = domain === undefined;
	const effectiveDomain = (domain ?? ctx.requestHost).toLowerCase();
	const effectivePath = path ?? defaultPathFromContext(ctx.requestPath);

	return {
		name,
		value,
		domain: effectiveDomain,
		path: effectivePath,
		hostOnly,
		secure,
		httpOnly,
		sameSite,
		expires: effectiveExpires,
		creation: now,
		lastAccessed: now,
	};
}

/**
 * Split a Set-Cookie value on `;` while respecting that `Expires` values
 * historically contain commas. We split on `;` only — commas inside
 * attribute values are preserved.
 */
function splitAttributes(raw: string): string[] {
	return raw
		.split(';')
		.map(s => s.trim())
		.filter(s => s.length > 0);
}

/**
 * Multiple Set-Cookie headers in a single response are commonly folded
 * into one string by HTTP libraries (separated by `, `). The naïve
 * `split(', ')` butchers cookies whose Expires attribute contains a
 * comma (`Expires=Wed, 09 Jun 2021 10:18:14 GMT`). This splitter looks
 * ahead for the `<token>=` pattern at the start of each candidate
 * segment — cookie boundaries — and keeps everything in between glued
 * together.
 */
export function splitFoldedSetCookies(folded: string): string[] {
	const out: string[] = [];
	const tokens = folded.split(/,\s*/);
	let buffer = '';
	for (const tok of tokens) {
		// A cookie always starts with `name=` (printable token, no spaces).
		if (/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+=/.test(tok)) {
			if (buffer) out.push(buffer);
			buffer = tok;
		} else {
			buffer = buffer ? `${buffer}, ${tok}` : tok;
		}
	}
	if (buffer) out.push(buffer);
	return out;
}

function defaultPathFromContext(requestPath: string): string {
	if (!requestPath || !requestPath.startsWith('/')) return '/';
	const lastSlash = requestPath.lastIndexOf('/');
	if (lastSlash <= 0) return '/';
	return requestPath.slice(0, lastSlash);
}
