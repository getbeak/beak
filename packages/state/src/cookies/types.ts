export type CookieSameSite = 'Strict' | 'Lax' | 'None';

/**
 * A single cookie entry. RFC 6265 §5.3 storage model: identity is
 * `(name, domain, path)`; everything else is metadata. `hostOnly`
 * distinguishes an exact-host cookie (no Domain attribute received)
 * from a domain-match cookie (Domain attribute present).
 */
export interface CookieEntry {
	name: string;
	value: string;
	/**
	 * Canonical lowercase domain. Never carries a leading dot — host-only
	 * vs domain-match is recorded by the `hostOnly` flag instead.
	 */
	domain: string;
	path: string;
	hostOnly: boolean;
	secure: boolean;
	httpOnly: boolean;
	sameSite?: CookieSameSite;
	/** Epoch ms. Absent => session cookie. */
	expires?: number;
	creation: number;
	lastAccessed: number;
}

/** Cookies for one variable-set item ("environment"). */
export type CookieJarItem = CookieEntry[];

/** All cookies for one variable set, keyed by itemId. */
export type CookieJar = Record<string, CookieJarItem>;

export interface CookieSliceState {
	loaded: boolean;
	/** variableSetName → itemId → cookies */
	jars: Record<string, CookieJar>;
}

export const initialCookieState: CookieSliceState = {
	loaded: false,
	jars: {},
};
