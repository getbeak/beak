import type { CookieEntry } from './types';

/**
 * RFC 6265 §5.1.2 — canonicalise a host: lowercase, strip a trailing dot.
 * Doesn't IDN-encode (Beak deals with already-decoded URLs); doesn't
 * touch IPv6 brackets.
 */
export function canonicaliseHost(host: string): string {
	let h = host.trim().toLowerCase();
	if (h.endsWith('.')) h = h.slice(0, -1);
	return h;
}

/**
 * RFC 6265 §5.1.3 — does a request host match a cookie's domain?
 *
 * Host-only cookies require an exact (case-insensitive) match. Domain
 * cookies match when the host is a subdomain of `cookieDomain` (i.e.
 * cookieDomain is a suffix and the character preceding it is a dot).
 * IPs (v4 or v6) are exact-match only — never subdomain-matched.
 */
export function domainMatches(requestHost: string, cookieDomain: string, hostOnly: boolean): boolean {
	const host = canonicaliseHost(requestHost);
	const domain = canonicaliseHost(cookieDomain);
	if (host === domain) return true;
	if (hostOnly) return false;
	if (isIpLiteral(host)) return false;
	if (!host.endsWith(domain)) return false;
	const suffixStart = host.length - domain.length;
	if (suffixStart <= 0) return false;
	return host[suffixStart - 1] === '.';
}

/**
 * RFC 6265 §5.1.4 — does a request path match a cookie's path?
 *
 *  1) cookie-path == request-path, OR
 *  2) cookie-path is a prefix of request-path AND ends with '/', OR
 *  3) cookie-path is a prefix of request-path AND the next char of
 *     request-path is '/'.
 */
export function pathMatches(requestPath: string, cookiePath: string): boolean {
	const reqPath = requestPath || '/';
	const cookPath = cookiePath || '/';
	if (reqPath === cookPath) return true;
	if (!reqPath.startsWith(cookPath)) return false;
	if (cookPath.endsWith('/')) return true;
	return reqPath.charAt(cookPath.length) === '/';
}

/**
 * RFC 6265 §5.1.4 — derive the default cookie path from a request URL
 * path. The Set-Cookie default when no Path attribute is sent: take
 * everything up to (but not including) the trailing path segment, or
 * `/` if the URL has no parent.
 */
export function defaultPath(requestPath: string): string {
	if (!requestPath || !requestPath.startsWith('/')) return '/';
	const lastSlash = requestPath.lastIndexOf('/');
	if (lastSlash <= 0) return '/';
	return requestPath.slice(0, lastSlash);
}

export function isIpLiteral(host: string): boolean {
	// IPv6 literals arrive bracketed in URLs; canonicaliseHost preserves them.
	if (host.startsWith('[') && host.endsWith(']')) return true;
	// IPv4: four dot-separated 0-255 octets.
	const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
	return ipv4.test(host);
}

/** A cookie is expired if `expires` is set and in the past. Session cookies never expire. */
export function isExpired(cookie: CookieEntry, now: number = Date.now()): boolean {
	return typeof cookie.expires === 'number' && cookie.expires <= now;
}

/**
 * Apply the secure-context filter: a `Secure` cookie can only ride
 * https/wss requests. Schemeless local development (http://localhost)
 * is permitted by §5.4 since browsers treat localhost as secure — we
 * match that behaviour here.
 */
export function passesSecureFilter(cookie: CookieEntry, scheme: string, host: string): boolean {
	if (!cookie.secure) return true;
	const s = scheme.toLowerCase();
	if (s === 'https' || s === 'wss') return true;
	const h = canonicaliseHost(host);
	return h === 'localhost' || h.endsWith('.localhost') || h === '127.0.0.1' || h === '::1' || h === '[::1]';
}

interface FilterArgs {
	cookies: CookieEntry[];
	scheme: string;
	host: string;
	path: string;
	now?: number;
}

/**
 * Filter a flat cookie list down to the set that should ride a request
 * to the given URL parts. Sort order follows RFC 6265 §5.4: longer paths
 * first, then earlier creation time — that's the byte order servers
 * usually expect in the `Cookie` header.
 */
export function filterCookiesForRequest({ cookies, scheme, host, path, now = Date.now() }: FilterArgs): CookieEntry[] {
	const matched = cookies.filter(
		c =>
			!isExpired(c, now) &&
			domainMatches(host, c.domain, c.hostOnly) &&
			pathMatches(path, c.path) &&
			passesSecureFilter(c, scheme, host),
	);
	return matched.sort((a, b) => {
		if (a.path.length !== b.path.length) return b.path.length - a.path.length;
		return a.creation - b.creation;
	});
}

/** Serialise a list of cookies into the `Cookie` HTTP header value. */
export function serialiseCookieHeader(cookies: CookieEntry[]): string {
	return cookies.map(c => `${c.name}=${c.value}`).join('; ');
}
