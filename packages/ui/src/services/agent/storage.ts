import type { LocalAgentCapability } from '@beak/state/agent';

/**
 * Browser-side persistence for the paired local agent. Lives in the UI
 * package (not the web host) so both the host's IPC handlers and
 * renderer code can share one implementation.
 *
 * Stored in `localStorage` for two reasons: (1) it survives reloads
 * without bloating the persisted Redux store, (2) the host's flight
 * handler runs outside React and so needs cheap synchronous access.
 *
 * Tokens are opaque, origin-bound, and minted by the agent via the
 * PKCE flow — see `docs/adr/0001-local-agent-for-web-host.md` Decision §5.
 */
const TOKEN_KEY = 'beak.agent.token';
const TOKEN_ID_KEY = 'beak.agent.tokenId';
const BASE_URL_KEY = 'beak.agent.baseUrl';
const BASE_URL_TIMESTAMP_KEY = 'beak.agent.baseUrl.cachedAt';

export const AGENT_BASE_URL_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function safeGet(key: string): string | null {
	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
}
function safeSet(key: string, value: string): void {
	try {
		window.localStorage.setItem(key, value);
	} catch {
		// localStorage disabled (private mode, quota); the renderer surfaces
		// the failure when the next flight or discovery uses a missing entry.
	}
}
function safeDelete(key: string): void {
	try {
		window.localStorage.removeItem(key);
	} catch {
		// ignore
	}
}

export function getAgentToken(): string | null {
	return safeGet(TOKEN_KEY);
}
export function setAgentToken(token: string, tokenId?: string): void {
	safeSet(TOKEN_KEY, token);
	if (tokenId) safeSet(TOKEN_ID_KEY, tokenId);
}
export function getAgentTokenId(): string | null {
	return safeGet(TOKEN_ID_KEY);
}
export function clearAgentToken(): void {
	safeDelete(TOKEN_KEY);
	safeDelete(TOKEN_ID_KEY);
}

export function getCachedAgentBaseUrl(): string | null {
	const baseUrl = safeGet(BASE_URL_KEY);
	if (!baseUrl) return null;
	const cachedAt = Number.parseInt(safeGet(BASE_URL_TIMESTAMP_KEY) ?? '0', 10);
	if (!cachedAt || Date.now() - cachedAt > AGENT_BASE_URL_CACHE_TTL_MS) {
		// Stale; force a re-scan.
		safeDelete(BASE_URL_KEY);
		safeDelete(BASE_URL_TIMESTAMP_KEY);
		return null;
	}
	return baseUrl;
}
export function setCachedAgentBaseUrl(baseUrl: string): void {
	safeSet(BASE_URL_KEY, baseUrl);
	safeSet(BASE_URL_TIMESTAMP_KEY, String(Date.now()));
}
export function clearCachedAgentBaseUrl(): void {
	safeDelete(BASE_URL_KEY);
	safeDelete(BASE_URL_TIMESTAMP_KEY);
}

/**
 * Module-level snapshot of the host's `localAgent` capability. Set once
 * by the entrypoint right after `configureStore()`, read by anything
 * that needs to gate UI on whether agent machinery exists at all.
 *
 * Capabilities are static per-shell; using a module-level singleton
 * matches the existing `getAppStore` and `getRuntime` patterns. The
 * agent slice handles only *dynamic* state.
 */
let localAgentCapability: LocalAgentCapability = 'unsupported';

export function setLocalAgentCapability(capability: LocalAgentCapability): void {
	localAgentCapability = capability;
}

export function getLocalAgentCapability(): LocalAgentCapability {
	return localAgentCapability;
}
