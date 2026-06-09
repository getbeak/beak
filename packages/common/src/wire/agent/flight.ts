import { z } from 'zod';

export const requestOverviewSchema = z
	.object({
		verb: z.string().min(1),
		url: z.array(z.unknown()),
		body: z
			.object({
				type: z.string(),
			})
			.passthrough(),
		headers: z.record(z.string(), z.unknown()).optional(),
		options: z.record(z.string(), z.unknown()).optional(),
	})
	.passthrough();

export const flightRequestPayloadSchema = z.object({
	flightId: z.string().min(1),
	requestId: z.string().min(1),
	request: requestOverviewSchema,
});

export const responseStreamKindSchema = z.enum(['standard', 'sse', 'chunked']);

export const sseEventSchema = z.object({
	receivedAt: z.number(),
	id: z.string().optional(),
	event: z.string().optional(),
	data: z.string(),
	retry: z.number().optional(),
});

const baseHeartbeat = z.object({
	flightId: z.string().min(1),
});

export const heartbeatFetchResponseSchema = baseHeartbeat.extend({
	stage: z.literal('fetch_response'),
	payload: z.object({
		timestamp: z.number(),
	}),
});

export const heartbeatHeadReceivedSchema = baseHeartbeat.extend({
	stage: z.literal('head_received'),
	payload: z.object({
		timestamp: z.number(),
		status: z.number(),
		headers: z.record(z.string(), z.string()),
		url: z.string(),
		redirected: z.boolean(),
		contentType: z.string().nullable(),
		contentLength: z.number(),
		streamKind: responseStreamKindSchema,
	}),
});

export const heartbeatReadingBodySchema = baseHeartbeat.extend({
	stage: z.literal('reading_body'),
	payload: z.object({
		timestamp: z.number(),
		// Base64-encoded chunk. SSE is line-oriented UTF-8; raw bytes can't
		// transit. The renderer's parser decodes back to Uint8Array.
		buffer: z.string(),
	}),
});

export const heartbeatSseEventSchema = baseHeartbeat.extend({
	stage: z.literal('sse_event'),
	payload: z.object({
		timestamp: z.number(),
		event: sseEventSchema,
	}),
});

export const flightHeartbeatSchema = z.discriminatedUnion('stage', [
	heartbeatFetchResponseSchema,
	heartbeatHeadReceivedSchema,
	heartbeatReadingBodySchema,
	heartbeatSseEventSchema,
]);

export const flightCompleteSchema = z.object({
	flightId: z.string().min(1),
	timestamp: z.number(),
	overview: z.object({
		headers: z.record(z.string(), z.string()),
		redirected: z.boolean(),
		status: z.number(),
		url: z.string(),
		hasBody: z.boolean(),
	}),
});

export const flightFailedSchema = z.object({
	flightId: z.string().min(1),
	error: z.object({
		message: z.string(),
		code: z.string().optional(),
	}),
});

// In-process callback types live in `../../types/requester.ts` and derive
// from these schemas where shape coincides. Adding a duplicate `*Wire` alias
// here would just rot — consumers should `z.infer` at the call site.
