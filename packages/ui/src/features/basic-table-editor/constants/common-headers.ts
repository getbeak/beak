/**
 * Curated list of HTTP request header names for autocomplete in the
 * headers table editor. Coverage is the IANA-registered set from RFC
 * 9110 (HTTP semantics), RFC 9111 (caching), RFC 6265 (cookies), the
 * CORS spec, the Fetch metadata family, plus a handful of widely-used
 * non-standard names (X-Forwarded-*, X-Api-Key, …) that the user is
 * very likely to reach for. Response-only headers (Set-Cookie, ETag,
 * WWW-Authenticate, etc.) are intentionally omitted — they don't make
 * sense on an outgoing request.
 */

export interface HeaderSuggestion {
	name: string;
	description: string;
}

export const COMMON_REQUEST_HEADERS: HeaderSuggestion[] = [
	{ name: 'Accept', description: 'Media types the client can process.' },
	{ name: 'Accept-Charset', description: 'Charsets the client accepts (largely deprecated).' },
	{ name: 'Accept-Encoding', description: 'Content encodings the client supports (gzip, br, …).' },
	{ name: 'Accept-Language', description: 'Natural languages preferred for the response.' },
	{ name: 'Authorization', description: 'Credentials authenticating the client (Bearer, Basic, …).' },
	{ name: 'Cache-Control', description: 'Directives for the request/response caching pipeline.' },
	{ name: 'Connection', description: 'Hop-by-hop connection control (keep-alive, close, upgrade).' },
	{ name: 'Content-Encoding', description: 'Encoding(s) applied to the request body.' },
	{ name: 'Content-Language', description: 'Natural language of the request body.' },
	{ name: 'Content-Length', description: 'Octet length of the request body.' },
	{ name: 'Content-Location', description: 'URI of the resource that produced the body.' },
	{ name: 'Content-Range', description: 'Byte range of a partial-body request.' },
	{ name: 'Content-Type', description: 'Media type of the request body.' },
	{ name: 'Cookie', description: 'Stored HTTP cookies sent to the origin (RFC 6265).' },
	{ name: 'Date', description: 'Date and time the request was generated.' },
	{ name: 'DNT', description: 'Do-Not-Track signal (largely deprecated).' },
	{ name: 'Expect', description: 'Server behaviour the client requires (e.g. 100-continue).' },
	{ name: 'Forwarded', description: 'Proxy-chain info (replaces X-Forwarded-*).' },
	{ name: 'From', description: 'Email address of the user controlling the agent.' },
	{ name: 'Host', description: 'Target host and (optional) port.' },
	{ name: 'If-Match', description: 'Conditional: act only if the resource matches an ETag.' },
	{ name: 'If-Modified-Since', description: 'Conditional: act only if modified after a date.' },
	{ name: 'If-None-Match', description: 'Conditional: act only if no ETag matches.' },
	{ name: 'If-Range', description: 'Conditional range request.' },
	{ name: 'If-Unmodified-Since', description: 'Conditional: act only if not modified since a date.' },
	{ name: 'Max-Forwards', description: 'Hop limit for TRACE / OPTIONS.' },
	{ name: 'Origin', description: 'Origin of the request (CORS / fetch).' },
	{ name: 'Pragma', description: 'Implementation-specific cache directives (legacy).' },
	{ name: 'Prefer', description: 'Preferences the server should honour if possible.' },
	{ name: 'Proxy-Authorization', description: 'Credentials for an upstream proxy.' },
	{ name: 'Range', description: 'Byte range(s) of the resource being requested.' },
	{ name: 'Referer', description: 'Address of the page making the request.' },
	{ name: 'TE', description: 'Transfer codings the client accepts.' },
	{ name: 'Trailer', description: 'Header fields present after the chunked body.' },
	{ name: 'Transfer-Encoding', description: 'Encoding applied for transport (chunked, …).' },
	{ name: 'Upgrade', description: 'Request to switch protocols (e.g. websocket).' },
	{ name: 'Upgrade-Insecure-Requests', description: 'Signal a preference for upgrading insecure URLs.' },
	{ name: 'User-Agent', description: 'Identifies the client software.' },
	{ name: 'Via', description: 'Proxy chain identifier.' },
	{ name: 'Warning', description: 'Additional information about response status.' },

	// CORS / Fetch metadata
	{ name: 'Access-Control-Request-Method', description: 'Method the actual CORS request will use.' },
	{ name: 'Access-Control-Request-Headers', description: 'Headers the actual CORS request will use.' },
	{ name: 'Sec-Fetch-Dest', description: 'Fetch metadata: request destination.' },
	{ name: 'Sec-Fetch-Mode', description: 'Fetch metadata: request mode.' },
	{ name: 'Sec-Fetch-Site', description: 'Fetch metadata: site relationship.' },
	{ name: 'Sec-Fetch-User', description: 'Fetch metadata: triggered by a user activation.' },

	// Common non-standard but ubiquitous
	{ name: 'X-Api-Key', description: 'Service API key (de-facto standard).' },
	{ name: 'X-Correlation-Id', description: 'Correlation identifier across distributed services.' },
	{ name: 'X-CSRF-Token', description: 'Anti-CSRF token, often paired with cookie auth.' },
	{ name: 'X-Forwarded-For', description: 'Originating client IP behind a proxy.' },
	{ name: 'X-Forwarded-Host', description: 'Original Host header before proxying.' },
	{ name: 'X-Forwarded-Proto', description: 'Original protocol (http/https) before proxying.' },
	{ name: 'X-Forwarded-Port', description: 'Original port before proxying.' },
	{ name: 'X-Real-Ip', description: 'Originating client IP (nginx convention).' },
	{ name: 'X-Request-Id', description: 'Per-request identifier for tracing.' },
	{ name: 'X-Requested-With', description: 'AJAX marker (usually XMLHttpRequest).' },
];
