import { selectOutgoingCookies } from '@beak/state/cookies';
import type { FlightRequest, FlightRequestKeyValue } from '@beak/state/flight';
import type { ApplicationState } from '@beak/ui/store';

/**
 * Post-process a prepared `FlightRequest` to fold matching jar cookies
 * into the outgoing `Cookie` header. Pure with respect to the request
 * (returns a new object); only reads the cookies slice + preferences
 * from the supplied state.
 *
 * Merge rules with a user-set `Cookie` header:
 *   - User-set names always win — a user override is a deliberate act.
 *   - Jar cookies that aren't named in the user header are appended.
 *   - The merged value preserves the user-set header's row id so
 *     identifiable rows survive a round-trip through prepare.
 *
 * If the user's `Cookie` header is disabled, treat it as absent.
 */
export function attachCookiesToFlightRequest(state: ApplicationState, request: FlightRequest): FlightRequest {
	const urlString = (request.url[0] as string | undefined) ?? '';
	if (!urlString) return request;
	let scheme = '';
	let host = '';
	let path = '/';
	try {
		const u = new URL(urlString);
		scheme = u.protocol.replace(/:$/, '');
		host = u.hostname;
		path = u.pathname || '/';
	} catch {
		return request;
	}

	const selections = state.global.preferences.editor.selectedVariableSets ?? {};
	const outgoing = selectOutgoingCookies(state, selections, scheme, host, path);
	if (outgoing.cookies.length === 0) return request;

	const headers = { ...request.headers };
	const existingId = findEnabledCookieHeaderId(headers);
	const existingValue = existingId ? ((headers[existingId].value[0] as string | undefined) ?? '') : '';
	const merged = mergeCookieHeader(existingValue, outgoing.header);

	const mergedKv: FlightRequestKeyValue = {
		enabled: true,
		name: 'Cookie',
		value: [merged],
	};

	if (existingId) headers[existingId] = mergedKv;
	else headers[`cookie-${Date.now().toString(36)}`] = mergedKv;

	return { ...request, headers };
}

function findEnabledCookieHeaderId(headers: Record<string, FlightRequestKeyValue>): string | null {
	for (const [id, kv] of Object.entries(headers)) {
		if (kv.enabled && kv.name.toLowerCase() === 'cookie') return id;
	}
	return null;
}

/**
 * Merge a user-authored Cookie header string with the jar-resolved
 * string. Each is `name=value` pairs separated by `;`. The user's
 * pairs win on name conflicts; jar pairs fill the gaps. Whitespace
 * is normalised on output.
 */
export function mergeCookieHeader(userHeader: string, jarHeader: string): string {
	const userPairs = splitPairs(userHeader);
	const jarPairs = splitPairs(jarHeader);
	const seen = new Set<string>();
	const out: { name: string; value: string }[] = [];
	for (const p of userPairs) {
		seen.add(p.name);
		out.push(p);
	}
	for (const p of jarPairs) {
		if (seen.has(p.name)) continue;
		seen.add(p.name);
		out.push(p);
	}
	return out.map(p => `${p.name}=${p.value}`).join('; ');
}

function splitPairs(raw: string): { name: string; value: string }[] {
	if (!raw) return [];
	const out: { name: string; value: string }[] = [];
	for (const segment of raw.split(';')) {
		const trimmed = segment.trim();
		if (!trimmed) continue;
		const eq = trimmed.indexOf('=');
		if (eq <= 0) continue;
		const name = trimmed.slice(0, eq).trim();
		const value = trimmed.slice(eq + 1).trim();
		if (!name) continue;
		out.push({ name, value });
	}
	return out;
}
