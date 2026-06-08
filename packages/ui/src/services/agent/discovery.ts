import {
	AGENT_FINGERPRINT_NAME,
	AGENT_HEALTHZ_PATH,
	AGENT_PORT_RANGE_END,
	AGENT_PORT_RANGE_START,
	healthzResponseSchema,
	type HealthzResponseWire,
} from '@beak/common/wire/agent';

import { bytesToBase64Url, hmacSha256Base64Url, randomBytes } from './crypto';

const PROBE_TIMEOUT_MS = 200;

export interface DiscoveredAgent {
	baseUrl: string;
	healthz: HealthzResponseWire;
}

/**
 * Scan the agent port range and return the first endpoint that returns
 * the agent fingerprint. Returns null if none responds. Each probe is
 * capped at {@link PROBE_TIMEOUT_MS} so a cold scan finishes in seconds
 * even if many ports time out.
 *
 * `skipBaseUrls` lets the caller resume a scan after detecting an
 * impostor on a previously-discovered URL: pass the impostor URL in
 * and the next-best port wins. Without the skip list a paired user
 * would be stuck behind whatever process squatted on the agent's
 * preferred port.
 */
export async function discoverAgent(skipBaseUrls: readonly string[] = []): Promise<DiscoveredAgent | null> {
	const skip = new Set(skipBaseUrls);
	for (let port = AGENT_PORT_RANGE_START; port <= AGENT_PORT_RANGE_END; port++) {
		const baseUrl = `http://127.0.0.1:${port}`;
		if (skip.has(baseUrl)) continue;
		const healthz = await probe(baseUrl);
		if (healthz) return { baseUrl, healthz };
	}
	return null;
}

/** Probe a single base URL. Returns the parsed healthz body or null. */
export async function probe(baseUrl: string): Promise<HealthzResponseWire | null> {
	try {
		const response = await fetch(`${baseUrl}${AGENT_HEALTHZ_PATH}`, {
			signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
			mode: 'cors',
			credentials: 'omit',
		});
		if (!response.ok) return null;
		const json = (await response.json()) as unknown;
		const parsed = healthzResponseSchema.safeParse(json);
		if (!parsed.success) return null;
		if (parsed.data.agent !== AGENT_FINGERPRINT_NAME) return null;
		return parsed.data;
	} catch {
		return null;
	}
}

/**
 * Send a token-keyed nonce challenge to the agent's healthz endpoint.
 * Returns true iff the agent's HMAC signature over our nonce verifies
 * with the stored token. Used to defeat localhost impostors at sites
 * where the renderer already has a paired token.
 */
export async function verifyAgentIdentity(baseUrl: string, token: string): Promise<boolean> {
	const nonce = bytesToBase64Url(randomBytes(16));
	try {
		const response = await fetch(`${baseUrl}${AGENT_HEALTHZ_PATH}?nonce=${encodeURIComponent(nonce)}`, {
			signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
			mode: 'cors',
			credentials: 'omit',
			// biome-ignore lint/style/useNamingConvention: HTTP header name (RFC 7235).
			headers: { Authorization: `Bearer ${token}` },
		});
		if (!response.ok) return false;
		const json = (await response.json()) as unknown;
		const parsed = healthzResponseSchema.safeParse(json);
		if (!parsed.success) return false;
		if (parsed.data.agent !== AGENT_FINGERPRINT_NAME) return false;
		if (!parsed.data.signature || parsed.data.nonce !== nonce) return false;

		const expected = await hmacSha256Base64Url(token, nonce);
		return constantTimeEquals(expected, parsed.data.signature);
	} catch {
		return false;
	}
}

function constantTimeEquals(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}
