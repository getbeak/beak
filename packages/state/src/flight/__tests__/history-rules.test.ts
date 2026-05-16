import { describe, expect, it } from 'vitest';

import type { FlightHistoryFile } from '../../schemas/flight-history';
import {
	applyHistoryRules,
	compressEntry,
	enforceProjectCap,
	HISTORY_RULES,
	pruneRequestHistory,
} from '../history-rules';
import type { FlightHistoryEntry } from '../types';

function makeRuntimeEntry(overrides: Partial<FlightHistoryEntry> = {}): FlightHistoryEntry {
	return {
		flightId: 'f1',
		requestId: 'r1',
		binaryStoreKey: 'bin-f1',
		request: {
			verb: 'get',
			url: ['https://example.com'],
			query: {},
			headers: {
				h1: { name: 'Authorization', value: ['Bearer secret-token'], enabled: true },
				h2: { name: 'X-Trace', value: ['abc'], enabled: true },
				h3: { name: 'Disabled', value: ['x'], enabled: false },
			},
			body: { type: 'text', payload: '' },
			options: { followRedirects: false },
		},
		response: {
			status: 200,
			headers: { 'content-type': 'application/json' },
			url: 'https://example.com',
			redirected: false,
			hasBody: true,
		},
		timing: { beakStart: 1000, beakEnd: 1200 },
		...overrides,
	};
}

describe('compressEntry', () => {
	it('redacts well-known auth headers, keeps everything else', () => {
		const compressed = compressEntry(makeRuntimeEntry(), {});
		expect(compressed.request.headers.Authorization).toBe('***redacted***');
		expect(compressed.request.headers['X-Trace']).toBe('abc');
	});

	it('skips disabled headers entirely', () => {
		const compressed = compressEntry(makeRuntimeEntry(), {});
		expect(compressed.request.headers.Disabled).toBeUndefined();
	});

	it('inlines a small textual response body', () => {
		const bytes = new TextEncoder().encode('{"hello":"world"}');
		const compressed = compressEntry(makeRuntimeEntry(), { response: bytes });
		expect(compressed.response?.body).toBe('{"hello":"world"}');
		expect(compressed.response?.bodyTruncated).toBe(false);
		expect(compressed.response?.bodyBytes).toBe(bytes.byteLength);
	});

	it('truncates a textual response body above the cap, leaving metadata', () => {
		const big = 'a'.repeat(HISTORY_RULES.maxInlineBodyBytes + 1024);
		const bytes = new TextEncoder().encode(big);
		const compressed = compressEntry(makeRuntimeEntry(), { response: bytes });
		expect(compressed.response?.body?.length).toBeLessThanOrEqual(HISTORY_RULES.maxInlineBodyBytes);
		expect(compressed.response?.bodyTruncated).toBe(true);
		expect(compressed.response?.bodyBytes).toBe(bytes.byteLength);
	});

	it('drops the body for non-textual content, keeps size + truncated flag', () => {
		const compressed = compressEntry(
			makeRuntimeEntry({
				response: {
					status: 200,
					headers: { 'content-type': 'image/png' },
					url: 'https://example.com/icon.png',
					redirected: false,
					hasBody: true,
				},
			}),
			{ response: new Uint8Array(2048) },
		);
		expect(compressed.response?.body).toBeUndefined();
		expect(compressed.response?.bodyTruncated).toBe(true);
		expect(compressed.response?.bodyBytes).toBe(2048);
	});

	it('caps sseEvents at HISTORY_RULES.maxSseEvents', () => {
		const events = Array.from({ length: HISTORY_RULES.maxSseEvents + 50 }, (_, i) => ({
			receivedAt: i,
			data: String(i),
		}));
		const compressed = compressEntry(makeRuntimeEntry({ sseEvents: events }), {});
		expect(compressed.sseEvents?.length).toBe(HISTORY_RULES.maxSseEvents);
		// Tail kept, not head.
		expect(compressed.sseEvents?.[0].data).toBe(String(50));
	});

	it('maps beakStart/beakEnd timing to startedAt/completedAt + durationMs', () => {
		const compressed = compressEntry(makeRuntimeEntry(), {});
		expect(compressed.timing.startedAt).toBe(1000);
		expect(compressed.timing.completedAt).toBe(1200);
		expect(compressed.timing.durationMs).toBe(200);
	});
});

describe('pruneRequestHistory', () => {
	const now = 100_000_000;

	it('drops entries older than maxAgeMs', () => {
		const recent = compressEntry(makeRuntimeEntry({ flightId: 'recent', timing: { beakStart: now - 10_000, beakEnd: now } }), {});
		const stale = compressEntry(
			makeRuntimeEntry({
				flightId: 'stale',
				timing: { beakStart: now - HISTORY_RULES.maxAgeMs - 1, beakEnd: now - HISTORY_RULES.maxAgeMs },
			}),
			{},
		);
		const pruned = pruneRequestHistory([recent, stale], now);
		expect(pruned.map(e => e.flightId)).toEqual(['recent']);
	});

	it('caps at maxEntriesPerRequest, keeping the newest', () => {
		const entries = Array.from({ length: HISTORY_RULES.maxEntriesPerRequest + 5 }, (_, i) =>
			compressEntry(
				makeRuntimeEntry({ flightId: `f${i}`, timing: { beakStart: now - i * 1000, beakEnd: now - i * 1000 + 100 } }),
				{},
			),
		);
		const pruned = pruneRequestHistory(entries, now);
		expect(pruned.length).toBe(HISTORY_RULES.maxEntriesPerRequest);
		// Sorted newest first; the entry with the largest startedAt is at index 0.
		expect(pruned[0].flightId).toBe('f0');
	});
});

describe('enforceProjectCap', () => {
	it('returns the file unchanged when under the budget', () => {
		const file: FlightHistoryFile = {
			version: 1,
			histories: {
				r1: {
					entries: [
						compressEntry(makeRuntimeEntry({ flightId: 'f1', timing: { beakStart: 1, beakEnd: 2 } }), {}),
					],
					metadata: { totalFlights: 1, successfulExecutions: 1, successRate: 1 },
				},
			},
		};
		const after = enforceProjectCap(file);
		expect(after).toBe(file);
	});

	it('evicts oldest entries across requests to stay under the byte cap', () => {
		// Synthesize a file that violates the cap by stuffing big body strings
		// into many entries; verify the oldest ones drop first.
		const big = 'x'.repeat(64 * 1024);
		const makeEntry = (rid: string, fid: string, startedAt: number) => {
			const compressed = compressEntry(
				makeRuntimeEntry({
					requestId: rid,
					flightId: fid,
					timing: { beakStart: startedAt, beakEnd: startedAt + 10 },
				}),
				{ response: new TextEncoder().encode(big) },
			);
			return compressed;
		};

		const file: FlightHistoryFile = {
			version: 1,
			histories: {
				r1: {
					entries: Array.from({ length: 60 }, (_, i) => makeEntry('r1', `f${i}`, 10_000 + i)),
					metadata: { totalFlights: 60, successfulExecutions: 60, successRate: 1 },
				},
				r2: {
					entries: Array.from({ length: 60 }, (_, i) => makeEntry('r2', `g${i}`, 5_000 + i)),
					metadata: { totalFlights: 60, successfulExecutions: 60, successRate: 1 },
				},
			},
		};

		const after = enforceProjectCap(file);
		const total = Object.values(after.histories)
			.flatMap(h => h.entries)
			.map(e => JSON.stringify(e).length)
			.reduce((a, b) => a + b, 0);
		expect(total).toBeLessThanOrEqual(HISTORY_RULES.maxProjectBytes);

		// r2 had the oldest entries (startedAt around 5_000); they should drop
		// before r1's (around 10_000).
		const remainingR2 = after.histories.r2?.entries ?? [];
		expect(remainingR2.length).toBeLessThan(60);
	});
});

describe('applyHistoryRules', () => {
	it('composes per-request pruning + project cap', () => {
		const big = 'x'.repeat(64 * 1024);
		const startedAt = Date.now() - 1000;
		const compressedEntry = compressEntry(
			makeRuntimeEntry({ flightId: 'f1', timing: { beakStart: startedAt, beakEnd: startedAt + 10 } }),
			{ response: new TextEncoder().encode(big) },
		);
		const file: FlightHistoryFile = {
			version: 1,
			histories: {
				r1: {
					entries: Array.from({ length: HISTORY_RULES.maxEntriesPerRequest + 5 }, (_, i) => ({
						...compressedEntry,
						flightId: `f${i}`,
						timing: { startedAt: startedAt - i, completedAt: startedAt - i + 10 },
					})),
					metadata: { totalFlights: 25, successfulExecutions: 25, successRate: 1 },
				},
			},
		};
		const after = applyHistoryRules(file);
		expect(after.histories.r1.entries.length).toBeLessThanOrEqual(HISTORY_RULES.maxEntriesPerRequest);
	});
});
