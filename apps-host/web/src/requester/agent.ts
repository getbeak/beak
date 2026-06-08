import {
	AGENT_FLIGHT_PATH,
	flightCompleteSchema,
	flightFailedSchema,
	flightHeartbeatSchema,
} from '@beak/common/wire/agent';
import type { FlightCompletePayload, FlightHeartbeatPayload } from '@beak/common/types/requester';

import type { Requester, RequesterOptions } from './types';

/**
 * Routes a flight through the local agent. POSTs the request envelope to
 * `<baseUrl>/flight` with a bearer token; consumes the agent's SSE
 * response stream and translates each frame into the heartbeat callbacks
 * the renderer flight slice already understands.
 *
 * See `docs/adr/0001-local-agent-for-web-host.md` Decision §3 for the
 * wire shape, §5 for the auth model.
 */
export function createAgentRequester(baseUrl: string, token: string): Requester {
	return {
		async start(options: RequesterOptions) {
			const { payload, callbacks } = options;
			const { flightId } = payload;

			const controller = new AbortController();
			let response: Response;
			try {
				response = await fetch(`${baseUrl}${AGENT_FLIGHT_PATH}`, {
					method: 'POST',
					signal: controller.signal,
					headers: {
						'Content-Type': 'application/json',
						// biome-ignore lint/style/useNamingConvention: HTTP header names (RFC 7231/7235).
						Authorization: `Bearer ${token}`,
						// biome-ignore lint/style/useNamingConvention: HTTP header name (RFC 7231).
						Accept: 'text/event-stream',
					},
					body: JSON.stringify(payload),
				});
			} catch (error) {
				callbacks.failed({ flightId, error: error as Error });
				return;
			}

			if (response.status === 401) {
				callbacks.failed({ flightId, error: new Error('agent_unauthorized') });
				return;
			}
			if (!response.ok) {
				callbacks.failed({
					flightId,
					error: new Error(`agent flight failed with status ${response.status}`),
				});
				return;
			}
			if (response.body === null) {
				callbacks.failed({ flightId, error: new Error('agent returned empty body') });
				return;
			}

			try {
				await consumeAgentSse(response.body, callbacks, flightId);
			} catch (error) {
				callbacks.failed({ flightId, error: error as Error });
			}
		},
	};
}

async function consumeAgentSse(
	stream: ReadableStream<Uint8Array>,
	callbacks: RequesterOptions['callbacks'],
	flightId: string,
) {
	const reader = stream.getReader();
	const decoder = new TextDecoder('utf-8');
	let buffer = '';
	let currentEvent: string | undefined;
	const currentData: string[] = [];

	const dispatch = () => {
		if (currentData.length === 0 && currentEvent === undefined) return;
		const eventType = currentEvent;
		const dataStr = currentData.join('\n');
		currentEvent = undefined;
		currentData.length = 0;
		if (!eventType) return;
		let parsed: unknown;
		try {
			parsed = JSON.parse(dataStr);
		} catch {
			throw new Error(`agent sent invalid JSON for event ${eventType}`);
		}
		handleAgentFrame(eventType, parsed, callbacks, flightId);
	};

	while (true) {
		const { done, value } = await reader.read();
		if (value) buffer += decoder.decode(value, { stream: true });
		buffer = processBuffer(buffer, line => {
			if (line === '') {
				dispatch();
				return;
			}
			if (line.startsWith(':')) return; // comment
			const colonIdx = line.indexOf(':');
			const field = colonIdx === -1 ? line : line.slice(0, colonIdx);
			let val = colonIdx === -1 ? '' : line.slice(colonIdx + 1);
			if (val.startsWith(' ')) val = val.slice(1);
			if (field === 'event') currentEvent = val;
			else if (field === 'data') currentData.push(val);
			// `id:` and `retry:` are not used by the agent protocol; ignore.
		});
		if (done) break;
	}
	buffer += decoder.decode();
	if (buffer.length > 0) {
		// Trailing line without a newline — treat it as one final line.
		// (Agents that close cleanly always send the blank line first.)
		processBuffer(`${buffer}\n`, () => undefined);
	}
	dispatch();
}

function processBuffer(buffer: string, onLine: (line: string) => void): string {
	let cursor = 0;
	while (true) {
		const idx = nextLineEnd(buffer, cursor);
		if (idx === -1) break;
		onLine(buffer.slice(cursor, idx.index));
		cursor = idx.index + idx.skip;
	}
	return buffer.slice(cursor);
}

function nextLineEnd(buffer: string, from: number): { index: number; skip: number } | -1 {
	for (let i = from; i < buffer.length; i++) {
		const ch = buffer.charCodeAt(i);
		if (ch === 0x0a /* \n */) return { index: i, skip: 1 };
		if (ch === 0x0d /* \r */) {
			if (i + 1 < buffer.length && buffer.charCodeAt(i + 1) === 0x0a) return { index: i, skip: 2 };
			return { index: i, skip: 1 };
		}
	}
	return -1;
}

function handleAgentFrame(
	eventType: string,
	data: unknown,
	callbacks: RequesterOptions['callbacks'],
	flightId: string,
) {
	if (typeof data !== 'object' || data === null) return;
	const frame = data as Record<string, unknown>;

	// SSE frames cross a trust boundary (loopback agent → renderer). Validate
	// every payload against the wire schemas before forwarding to slice
	// callbacks.
	switch (eventType) {
		case 'fetch_response':
		case 'head_received':
		case 'sse_event': {
			const result = flightHeartbeatSchema.safeParse(frame);
			if (!result.success) {
				callbacks.failed({ flightId, error: new Error(`agent sent malformed ${eventType} frame`) });
				return;
			}
			// Wire shape for these stages is identical to the in-process shape
			// (no base64 buffer involved); the cast crosses the type system
			// because the discriminated union still includes `reading_body`.
			callbacks.heartbeat(result.data as FlightHeartbeatPayload);
			return;
		}
		case 'reading_body': {
			const result = flightHeartbeatSchema.safeParse(frame);
			if (!result.success || result.data.stage !== 'reading_body') {
				callbacks.failed({ flightId, error: new Error('agent sent malformed reading_body frame') });
				return;
			}
			// Decode the base64 chunk back to Uint8Array so downstream consumers
			// (flight slice, raw-body viewer) see the same shape as the
			// Electron/in-process path.
			callbacks.heartbeat({
				flightId,
				stage: 'reading_body',
				payload: {
					timestamp: result.data.payload.timestamp,
					buffer: base64ToBytes(result.data.payload.buffer),
				},
			});
			return;
		}
		case 'complete': {
			const result = flightCompleteSchema.safeParse(frame);
			if (!result.success) {
				callbacks.failed({ flightId, error: new Error('agent sent malformed complete frame') });
				return;
			}
			callbacks.complete(result.data as FlightCompletePayload);
			return;
		}
		case 'failed': {
			const result = flightFailedSchema.safeParse(frame);
			const message = result.success ? result.data.error.message : 'unknown agent failure';
			callbacks.failed({ flightId, error: new Error(message) });
			return;
		}
	}
}

function base64ToBytes(input: string): Uint8Array {
	const binary = atob(input);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}
