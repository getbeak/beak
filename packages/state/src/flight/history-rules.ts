import type {
	FlightHistoryFile,
	PersistedFlightEntry,
	PersistedFlightHistory,
} from '../schemas/flight-history';
import type { FlightHistory, FlightHistoryEntry } from './types';

/**
 * Flight-history persistence rules.
 *
 * The runtime keeps a much richer record per flight (full request body,
 * binary response bytes, SSE event log, …) than makes sense to write to
 * disk. These rules turn the runtime shape into a compact, redacted form
 * we'll happily check in to `.beak/flight-history.json`:
 *
 *  - Per-request cap: 20 entries.  Newer pushes out the oldest.
 *  - Time bound: 30 days. Older entries get pruned on save.
 *  - Body inline limit: 256KB raw bytes, text-content-types only.
 *    Larger or binary → keep metadata (status, size, content-type) and
 *    drop the body.
 *  - Auth header redaction: a small list of well-known sensitive header
 *    names get their values replaced with `***redacted***`. Keeps names
 *    so debugging still shows the auth scheme.
 *  - SSE events: keep the last 100 of any single flight.
 *  - Project cap: 5MB total. Exceeded → evict oldest entries across
 *    every request until under the cap.
 *
 * The rules live as pure functions so they're unit-testable + reusable
 * by the renderer effect, the eventual CLI dumper, and any future
 * pre-flight hooks.
 */

export const HISTORY_RULES = {
	maxEntriesPerRequest: 20,
	maxAgeMs: 30 * 24 * 60 * 60 * 1000,
	maxInlineBodyBytes: 256 * 1024,
	maxSseEvents: 100,
	maxProjectBytes: 5 * 1024 * 1024,
} as const;

const REDACTED = '***redacted***';
const REDACT_HEADER_NAMES = new Set([
	'authorization',
	'cookie',
	'set-cookie',
	'proxy-authorization',
	'x-api-key',
	'x-auth-token',
	'x-access-token',
	'api-key',
	'apikey',
	'x-csrf-token',
	'x-xsrf-token',
]);

function redactHeaders(headers: Record<string, string>): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [name, value] of Object.entries(headers)) {
		out[name] = REDACT_HEADER_NAMES.has(name.toLowerCase()) ? REDACTED : value;
	}
	return out;
}

function isTextualContentType(contentType: string | undefined | null): boolean {
	if (!contentType) return false;
	const lower = contentType.toLowerCase();
	if (lower.startsWith('text/')) return true;
	if (lower.startsWith('application/')) {
		// json / graphql / xml / x-www-form-urlencoded etc.
		return /^application\/(json|graphql|xml|javascript|xhtml\+xml|x-www-form-urlencoded|.*\+json|.*\+xml)/.test(
			lower,
		);
	}
	return false;
}

function utf8ByteLength(s: string): number {
	// Avoids spinning up TextEncoder for short strings — for the cap check we
	// only need an upper bound, and `Buffer.byteLength` isn't available in the
	// renderer. Use TextEncoder; it's fast and accurate.
	return new TextEncoder().encode(s).length;
}

/**
 * Truncate a textual body to `maxBytes` along a UTF-8 boundary. Returns
 * the prefix + a flag indicating whether truncation happened.
 */
function truncateUtf8(text: string, maxBytes: number): { text: string; truncated: boolean; bytes: number } {
	const totalBytes = utf8ByteLength(text);
	if (totalBytes <= maxBytes) return { text, truncated: false, bytes: totalBytes };
	// Binary-search the JS-string offset that produces ≤ maxBytes when encoded.
	let lo = 0;
	let hi = text.length;
	while (lo < hi) {
		const mid = (lo + hi + 1) >>> 1;
		const slice = text.slice(0, mid);
		if (utf8ByteLength(slice) <= maxBytes) lo = mid;
		else hi = mid - 1;
	}
	return { text: text.slice(0, lo), truncated: true, bytes: totalBytes };
}

/**
 * Decode a Uint8Array as UTF-8 + apply the inline-body cap. Returns
 * `undefined` for the body when truncation drops it entirely (e.g. body
 * starts past the cap or the content-type isn't textual).
 */
function compressBody(
	bytes: Uint8Array | undefined,
	contentType: string | undefined,
	maxBytes: number,
): {
	body?: string;
	bodyTruncated?: boolean;
	bodyBytes?: number;
} {
	if (!bytes || bytes.byteLength === 0) return {};
	const totalBytes = bytes.byteLength;
	if (!isTextualContentType(contentType)) {
		return { bodyBytes: totalBytes, bodyTruncated: true };
	}
	if (totalBytes > maxBytes) {
		// Decode just the head — avoids materializing the full string for a 50MB
		// response we'll throw most of away.
		const head = bytes.slice(0, maxBytes);
		const decoded = new TextDecoder('utf-8', { fatal: false }).decode(head);
		const { text } = truncateUtf8(decoded, maxBytes);
		return { body: text, bodyTruncated: true, bodyBytes: totalBytes };
	}
	const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
	return { body: decoded, bodyTruncated: false, bodyBytes: totalBytes };
}

/**
 * Build the on-disk shape from a runtime `FlightHistoryEntry`. Body bytes
 * for request + response come from the binary store; pass them in via the
 * `bytes` accessor so this function stays pure (no IO).
 */
export function compressEntry(
	entry: FlightHistoryEntry,
	bytes: { request?: Uint8Array; response?: Uint8Array },
): PersistedFlightEntry {
	const headers = entry.request.headers ?? {};
	const requestHeaders: Record<string, string> = {};
	for (const v of Object.values(headers)) {
		if (v.enabled !== false) {
			const value = Array.isArray(v.value)
				? v.value
						.map(p => (typeof p === 'string' ? p : `{{${(p as { type: string }).type}}}`))
						.join('')
				: String(v.value);
			requestHeaders[v.name] = value;
		}
	}

	const requestBodyContentType = requestHeaders['Content-Type'] ?? requestHeaders['content-type'];
	const compressedRequestBody = compressBody(bytes.request, requestBodyContentType, HISTORY_RULES.maxInlineBodyBytes);

	const responseHeaders = entry.response?.headers ?? {};
	const responseContentType = responseHeaders['content-type'] ?? responseHeaders['Content-Type'];
	const compressedResponseBody = entry.response
		? compressBody(bytes.response, responseContentType, HISTORY_RULES.maxInlineBodyBytes)
		: {};

	return {
		flightId: entry.flightId,
		requestId: entry.requestId,
		request: {
			verb: entry.request.verb,
			url: Array.isArray(entry.request.url)
				? entry.request.url
						.map(p => (typeof p === 'string' ? p : `{{${(p as { type: string }).type}}}`))
						.join('')
				: String(entry.request.url),
			headers: redactHeaders(requestHeaders),
			...compressedRequestBody,
			...(requestBodyContentType ? { bodyContentType: requestBodyContentType } : {}),
		},
		...(entry.response
			? {
					response: {
						status: entry.response.status,
						headers: redactHeaders(responseHeaders),
						url: entry.response.url,
						redirected: entry.response.redirected,
						hasBody: entry.response.hasBody,
						...compressedResponseBody,
						...(responseContentType ? { bodyContentType: responseContentType } : {}),
					},
				}
			: {}),
		...(entry.error ? { errorMessage: entry.error.message } : {}),
		timing: {
			startedAt: entry.timing.beakStart,
			...(entry.timing.beakEnd !== undefined ? { completedAt: entry.timing.beakEnd } : {}),
			...(entry.timing.beakEnd !== undefined && entry.timing.beakStart
				? { durationMs: entry.timing.beakEnd - entry.timing.beakStart }
				: {}),
		},
		...(entry.sseEvents && entry.sseEvents.length > 0
			? {
					sseEvents: entry.sseEvents.slice(-HISTORY_RULES.maxSseEvents),
				}
			: {}),
		...(entry.streamKind ? { streamKind: entry.streamKind } : {}),
	};
}

/**
 * Apply per-request rules to a single request's history list: time-bound
 * pruning + cap-by-count. Sorted newest-first on the way out so eviction
 * across requests (the project-cap pass) can take the tail of each list
 * without resorting.
 */
export function pruneRequestHistory(
	entries: PersistedFlightEntry[],
	now = Date.now(),
): PersistedFlightEntry[] {
	const minStartedAt = now - HISTORY_RULES.maxAgeMs;
	const fresh = entries.filter(e => e.timing.startedAt >= minStartedAt);
	fresh.sort((a, b) => b.timing.startedAt - a.timing.startedAt);
	return fresh.slice(0, HISTORY_RULES.maxEntriesPerRequest);
}

function estimateBytes(entry: PersistedFlightEntry): number {
	// Rough — JSON serialisation overhead is dominated by the bodies; the
	// rest (headers, urls, timings) is small enough that approximating the
	// length of a stringify works for the cap-eviction heuristic.
	return JSON.stringify(entry).length;
}

/**
 * Project-wide cap: enforce a total byte budget across every request's
 * history. When over budget, evict oldest entries across all requests
 * until the budget fits.
 */
export function enforceProjectCap(file: FlightHistoryFile): FlightHistoryFile {
	type Indexed = { requestId: string; idx: number; entry: PersistedFlightEntry; bytes: number };
	const all: Indexed[] = [];
	let total = 0;

	for (const [requestId, history] of Object.entries(file.histories)) {
		history.entries.forEach((entry, idx) => {
			const bytes = estimateBytes(entry);
			all.push({ requestId, idx, entry, bytes });
			total += bytes;
		});
	}

	if (total <= HISTORY_RULES.maxProjectBytes) return file;

	// Oldest first: evict in ascending start time.
	all.sort((a, b) => a.entry.timing.startedAt - b.entry.timing.startedAt);

	const drop = new Set<string>();
	for (const item of all) {
		if (total <= HISTORY_RULES.maxProjectBytes) break;
		drop.add(`${item.requestId}|${item.entry.flightId}`);
		total -= item.bytes;
	}

	const next: FlightHistoryFile = { version: file.version, histories: {} };
	for (const [requestId, history] of Object.entries(file.histories)) {
		const kept = history.entries.filter(e => !drop.has(`${requestId}|${e.flightId}`));
		if (kept.length > 0 || (history.selected && history.entries.some(e => e.flightId === history.selected))) {
			next.histories[requestId] = { ...history, entries: kept };
		}
	}
	return next;
}

/**
 * Compose per-request pruning + project cap. Caller does this on every
 * persist tick so disk + memory stay in lockstep.
 */
export function applyHistoryRules(file: FlightHistoryFile, now = Date.now()): FlightHistoryFile {
	const next: FlightHistoryFile = { version: file.version, histories: {} };
	for (const [requestId, history] of Object.entries(file.histories)) {
		const pruned = pruneRequestHistory(history.entries, now);
		next.histories[requestId] = { ...history, entries: pruned };
	}
	return enforceProjectCap(next);
}

/**
 * Hydrate a single request's persisted history back into the runtime
 * `FlightHistory` shape. Entries that were body-truncated stay so — the
 * inspector renders the preview + a "Body truncated" badge.
 */
export function persistedToRuntimeHistory(persisted: PersistedFlightHistory): FlightHistory {
	const history: Record<string, FlightHistoryEntry> = {};
	for (const entry of persisted.entries) {
		// Construct a runtime-shape entry from the persisted form. Many
		// runtime fields (binaryStoreKey, full RequestOverview body) aren't
		// recoverable — we leave them as best-effort placeholders. The flight
		// inspector handles missing-body gracefully.
		const runtimeEntry = {
			flightId: entry.flightId,
			requestId: entry.requestId,
			binaryStoreKey: `${entry.flightId}-hydrated`,
			request: {
				verb: entry.request.verb,
				url: [entry.request.url],
				query: {},
				headers: {},
				body: { type: 'text', payload: entry.request.body ?? '' },
				options: { followRedirects: false },
			} as FlightHistoryEntry['request'],
			...(entry.response
				? {
						response: {
							status: entry.response.status,
							headers: entry.response.headers,
							url: entry.response.url,
							redirected: entry.response.redirected ?? false,
							hasBody: entry.response.hasBody,
						},
					}
				: {}),
			...(entry.errorMessage ? { error: new Error(entry.errorMessage) } : {}),
			timing: {
				beakStart: entry.timing.startedAt,
				...(entry.timing.completedAt !== undefined ? { beakEnd: entry.timing.completedAt } : {}),
			} as FlightHistoryEntry['timing'],
			...(entry.sseEvents ? { sseEvents: entry.sseEvents } : {}),
			...(entry.streamKind ? { streamKind: entry.streamKind } : {}),
		} as FlightHistoryEntry;
		history[entry.flightId] = runtimeEntry;
	}

	return {
		selected: persisted.selected,
		history,
		metadata: persisted.metadata,
	};
}
