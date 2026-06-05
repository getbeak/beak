import { z } from 'zod';

/**
 * Flight history is persisted per-project under `.beak/flight-history.json`
 * so reopening a request shows the last few responses immediately — and so
 * the next phase (endpoint schema cache) can read the last successful
 * introspection out of the same store.
 *
 * The on-disk shape is intentionally a leaner subset of the in-memory
 * `FlightHistoryEntry`: we strip binaries, redact common auth headers,
 * cap body previews, and enforce per-request + project-wide limits. See
 * `applyHistoryRules` in `../flight/history-rules.ts`.
 */

const persistedHeadersSchema = z.record(z.string(), z.string());

const persistedRequestSchema = z
	.object({
		verb: z.string(),
		/** Resolved URL after variable substitution. */
		url: z.string(),
		headers: persistedHeadersSchema,
		/** Inline body bytes (UTF-8) when textual + small; absent for binary / oversized. */
		body: z.string().optional(),
		bodyTruncated: z.boolean().optional(),
		bodyBytes: z.number().int().nonnegative().optional(),
		bodyContentType: z.string().optional(),
	})
	.passthrough();

const persistedResponseSchema = z
	.object({
		status: z.number().int(),
		headers: persistedHeadersSchema,
		url: z.string(),
		redirected: z.boolean().optional(),
		hasBody: z.boolean(),
		/** Inline body bytes (UTF-8) when textual + small; absent for binary / oversized. */
		body: z.string().optional(),
		bodyTruncated: z.boolean().optional(),
		bodyBytes: z.number().int().nonnegative().optional(),
		bodyContentType: z.string().optional(),
	})
	.passthrough();

const persistedSseEventSchema = z
	.object({
		receivedAt: z.number(),
		id: z.string().optional(),
		event: z.string().optional(),
		data: z.string(),
		retry: z.number().optional(),
	})
	.strict();

const persistedFlightTimingSchema = z
	.object({
		startedAt: z.number().int(),
		completedAt: z.number().int().optional(),
		durationMs: z.number().int().nonnegative().optional(),
		/** Raw wall-clock landmarks from the runtime entry — kept so the
		 *  Overview tab can compute the same network-only duration after
		 *  a refresh as it did during the original flight. */
		requestStart: z.number().int().optional(),
		headersEnd: z.number().int().optional(),
		responseEnd: z.number().int().optional(),
	})
	.passthrough();

export const persistedFlightEntrySchema = z
	.object({
		flightId: z.string().min(1),
		requestId: z.string().min(1),
		request: persistedRequestSchema,
		response: persistedResponseSchema.optional(),
		errorMessage: z.string().optional(),
		timing: persistedFlightTimingSchema,
		/** Bounded slice of the SSE event log (last N events). */
		sseEvents: z.array(persistedSseEventSchema).optional(),
		streamKind: z.enum(['standard', 'sse', 'chunked']).optional(),
	})
	.passthrough();

export type PersistedFlightEntry = z.infer<typeof persistedFlightEntrySchema>;

const persistedFlightHistoryMetadataSchema = z
	.object({
		totalFlights: z.number().int().nonnegative(),
		successfulExecutions: z.number().int().nonnegative(),
		lastExecuted: z.number().int().optional(),
		averageResponseTime: z.number().optional(),
		successRate: z.number(),
	})
	.passthrough();

export const persistedFlightHistorySchema = z
	.object({
		selected: z.string().optional(),
		entries: z.array(persistedFlightEntrySchema),
		metadata: persistedFlightHistoryMetadataSchema,
	})
	.passthrough();

export type PersistedFlightHistory = z.infer<typeof persistedFlightHistorySchema>;

/** On-disk shape of `.beak/flight-history.json`. Versioned for forward compat. */
export const flightHistoryFileSchema = z
	.object({
		version: z.literal(1),
		histories: z.record(z.string(), persistedFlightHistorySchema),
	})
	.strict();

export type FlightHistoryFile = z.infer<typeof flightHistoryFileSchema>;

export function emptyFlightHistoryFile(): FlightHistoryFile {
	return { version: 1, histories: {} };
}
