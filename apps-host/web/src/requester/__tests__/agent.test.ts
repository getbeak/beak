import type {
	FlightCompletePayload,
	FlightFailedPayload,
	FlightHeartbeatPayload,
	FlightRequestPayload,
} from '@beak/common/types/requester';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createAgentRequester } from '../agent';

/**
 * Build a ReadableStream from a list of pre-formatted SSE frames so tests
 * can drive the agent adapter without spinning up a real HTTP server.
 */
function streamFromFrames(frames: string[]): ReadableStream<Uint8Array> {
	const encoder = new TextEncoder();
	return new ReadableStream({
		start(controller) {
			for (const f of frames) controller.enqueue(encoder.encode(f));
			controller.close();
		},
	});
}

/**
 * Build a ReadableStream that emits frames one at a time and exposes a
 * `cancel` hook so tests can simulate the agent disconnecting mid-stream.
 * Lets us synchronise emission with the test's signal-abort moment.
 */
function controlledStream(): {
	stream: ReadableStream<Uint8Array>;
	emit: (frame: string) => void;
	close: () => void;
	error: (err: unknown) => void;
} {
	const encoder = new TextEncoder();
	let controller!: ReadableStreamDefaultController<Uint8Array>;
	const stream = new ReadableStream<Uint8Array>({
		start(c) {
			controller = c;
		},
	});
	return {
		stream,
		emit: (frame: string) => controller.enqueue(encoder.encode(frame)),
		close: () => controller.close(),
		error: (err: unknown) => controller.error(err),
	};
}

function buildResponse(init: { ok?: boolean; status?: number; body?: ReadableStream<Uint8Array> | null }): Response {
	const status = init.status ?? 200;
	const ok = init.ok ?? (status >= 200 && status < 300);
	return {
		ok,
		status,
		body: init.body ?? null,
	} as unknown as Response;
}

function basePayload(): FlightRequestPayload {
	return {
		flightId: 'flight-1',
		requestId: 'request-1',
		request: {
			verb: 'get',
			url: ['https://example.com'],
			body: { type: 'text', payload: '' },
			headers: {},
			options: {},
		} as unknown as FlightRequestPayload['request'],
	};
}

function makeCallbacks() {
	return {
		heartbeat: vi.fn<(payload: FlightHeartbeatPayload) => void>(),
		complete: vi.fn<(payload: FlightCompletePayload) => void>(),
		failed: vi.fn<(payload: FlightFailedPayload) => void>(),
	};
}

const baseUrl = 'http://127.0.0.1:47821';
const token = 'test-token';

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
	fetchSpy = vi.fn();
	globalThis.fetch = fetchSpy as unknown as typeof fetch;
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('createAgentRequester — happy path', () => {
	it('POSTs to <baseUrl>/flight with correct headers and body', async () => {
		const payload = basePayload();
		fetchSpy.mockResolvedValueOnce(buildResponse({ body: streamFromFrames([]) }));

		const requester = createAgentRequester(baseUrl, token);
		const controller = new AbortController();
		await requester.start({ payload, signal: controller.signal, callbacks: makeCallbacks() });

		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const [url, init] = fetchSpy.mock.calls[0];
		expect(url).toBe(`${baseUrl}/flight`);
		expect(init.method).toBe('POST');
		expect(init.headers.Authorization).toBe(`Bearer ${token}`);
		expect(init.headers.Accept).toBe('text/event-stream');
		expect(init.headers['Content-Type']).toBe('application/json');
		expect(init.body).toBe(JSON.stringify(payload));
	});

	it('forwards the AbortSignal to fetch', async () => {
		const payload = basePayload();
		fetchSpy.mockResolvedValueOnce(buildResponse({ body: streamFromFrames([]) }));

		const requester = createAgentRequester(baseUrl, token);
		const controller = new AbortController();
		await requester.start({ payload, signal: controller.signal, callbacks: makeCallbacks() });

		const [, init] = fetchSpy.mock.calls[0];
		expect(init.signal).toBe(controller.signal);
	});

	it('streams a typical sequence: fetch_response → head_received → reading_body → complete', async () => {
		const payload = basePayload();
		const callbacks = makeCallbacks();

		const frames = [
			'event: fetch_response\ndata: {"flightId":"flight-1","stage":"fetch_response","payload":{"timestamp":1000}}\n\n',
			'event: head_received\ndata: {"flightId":"flight-1","stage":"head_received","payload":{"timestamp":1001,"status":200,"headers":{"content-type":"text/plain"},"url":"https://example.com","redirected":false,"contentType":"text/plain","contentLength":5,"streamKind":"standard"}}\n\n',
			'event: reading_body\ndata: {"flightId":"flight-1","stage":"reading_body","payload":{"timestamp":1002,"buffer":"aGVsbG8="}}\n\n',
			'event: reading_body\ndata: {"flightId":"flight-1","stage":"reading_body","payload":{"timestamp":1003,"buffer":"d29ybGQ="}}\n\n',
			'event: complete\ndata: {"flightId":"flight-1","timestamp":1004,"overview":{"headers":{"content-type":"text/plain"},"redirected":false,"status":200,"url":"https://example.com","hasBody":true}}\n\n',
		];

		fetchSpy.mockResolvedValueOnce(buildResponse({ body: streamFromFrames(frames) }));

		const requester = createAgentRequester(baseUrl, token);
		await requester.start({ payload, signal: new AbortController().signal, callbacks });

		expect(callbacks.failed).not.toHaveBeenCalled();
		expect(callbacks.heartbeat).toHaveBeenCalledTimes(4);
		expect(callbacks.complete).toHaveBeenCalledTimes(1);

		// Order: fetch_response → head_received → reading_body × 2
		expect(callbacks.heartbeat.mock.calls[0][0].stage).toBe('fetch_response');
		expect(callbacks.heartbeat.mock.calls[1][0].stage).toBe('head_received');
		expect(callbacks.heartbeat.mock.calls[2][0].stage).toBe('reading_body');
		expect(callbacks.heartbeat.mock.calls[3][0].stage).toBe('reading_body');

		// And complete payload made it through
		const completeArg = callbacks.complete.mock.calls[0][0];
		expect(completeArg.flightId).toBe('flight-1');
		expect(completeArg.overview.status).toBe(200);
	});

	it('decodes reading_body base64 buffer to Uint8Array', async () => {
		const payload = basePayload();
		const callbacks = makeCallbacks();

		// "hello" → base64 "aGVsbG8=" → bytes [0x68,0x65,0x6c,0x6c,0x6f]
		const frame =
			'event: reading_body\ndata: {"flightId":"flight-1","stage":"reading_body","payload":{"timestamp":2000,"buffer":"aGVsbG8="}}\n\n';

		fetchSpy.mockResolvedValueOnce(buildResponse({ body: streamFromFrames([frame]) }));

		const requester = createAgentRequester(baseUrl, token);
		await requester.start({ payload, signal: new AbortController().signal, callbacks });

		expect(callbacks.heartbeat).toHaveBeenCalledTimes(1);
		const heartbeat = callbacks.heartbeat.mock.calls[0][0];
		expect(heartbeat.stage).toBe('reading_body');
		if (heartbeat.stage === 'reading_body') {
			expect(heartbeat.payload.buffer).toBeInstanceOf(Uint8Array);
			expect(Array.from(heartbeat.payload.buffer)).toEqual([0x68, 0x65, 0x6c, 0x6c, 0x6f]);
			expect(heartbeat.payload.timestamp).toBe(2000);
		}
		expect(callbacks.failed).not.toHaveBeenCalled();
	});
});

describe('createAgentRequester — error paths', () => {
	it('HTTP 401 translates to agent_unauthorized', async () => {
		const payload = basePayload();
		const callbacks = makeCallbacks();
		fetchSpy.mockResolvedValueOnce(buildResponse({ ok: false, status: 401 }));

		const requester = createAgentRequester(baseUrl, token);
		await requester.start({ payload, signal: new AbortController().signal, callbacks });

		expect(callbacks.failed).toHaveBeenCalledTimes(1);
		expect(callbacks.failed.mock.calls[0][0].error.message).toBe('agent_unauthorized');
		expect(callbacks.heartbeat).not.toHaveBeenCalled();
		expect(callbacks.complete).not.toHaveBeenCalled();
	});

	it('non-401 non-OK includes the status in the error message', async () => {
		const payload = basePayload();
		const callbacks = makeCallbacks();
		fetchSpy.mockResolvedValueOnce(buildResponse({ ok: false, status: 502 }));

		const requester = createAgentRequester(baseUrl, token);
		await requester.start({ payload, signal: new AbortController().signal, callbacks });

		expect(callbacks.failed).toHaveBeenCalledTimes(1);
		expect(callbacks.failed.mock.calls[0][0].error.message).toContain('502');
		expect(callbacks.heartbeat).not.toHaveBeenCalled();
	});

	it('empty body fails with agent returned empty body', async () => {
		const payload = basePayload();
		const callbacks = makeCallbacks();
		fetchSpy.mockResolvedValueOnce(buildResponse({ ok: true, status: 200, body: null }));

		const requester = createAgentRequester(baseUrl, token);
		await requester.start({ payload, signal: new AbortController().signal, callbacks });

		expect(callbacks.failed).toHaveBeenCalledTimes(1);
		expect(callbacks.failed.mock.calls[0][0].error.message).toBe('agent returned empty body');
	});

	it('fetch network error is surfaced as failed', async () => {
		const payload = basePayload();
		const callbacks = makeCallbacks();
		const networkError = new TypeError('Failed to fetch');
		fetchSpy.mockRejectedValueOnce(networkError);

		const requester = createAgentRequester(baseUrl, token);
		await requester.start({ payload, signal: new AbortController().signal, callbacks });

		expect(callbacks.failed).toHaveBeenCalledTimes(1);
		expect(callbacks.failed.mock.calls[0][0].error).toBe(networkError);
	});
});

describe('createAgentRequester — trust-boundary validation', () => {
	it('malformed fetch_response frame (missing payload) emits failed', async () => {
		const payload = basePayload();
		const callbacks = makeCallbacks();
		const frame = 'event: fetch_response\ndata: {"flightId":"flight-1","stage":"fetch_response"}\n\n';

		fetchSpy.mockResolvedValueOnce(buildResponse({ body: streamFromFrames([frame]) }));

		const requester = createAgentRequester(baseUrl, token);
		await requester.start({ payload, signal: new AbortController().signal, callbacks });

		expect(callbacks.heartbeat).not.toHaveBeenCalled();
		expect(callbacks.failed).toHaveBeenCalledTimes(1);
		expect(callbacks.failed.mock.calls[0][0].error.message).toMatch(/malformed/);
	});

	it('malformed head_received frame (missing status) emits failed', async () => {
		const payload = basePayload();
		const callbacks = makeCallbacks();
		const frame =
			'event: head_received\ndata: {"flightId":"flight-1","stage":"head_received","payload":{"timestamp":1}}\n\n';

		fetchSpy.mockResolvedValueOnce(buildResponse({ body: streamFromFrames([frame]) }));

		const requester = createAgentRequester(baseUrl, token);
		await requester.start({ payload, signal: new AbortController().signal, callbacks });

		expect(callbacks.heartbeat).not.toHaveBeenCalled();
		expect(callbacks.failed).toHaveBeenCalledTimes(1);
		expect(callbacks.failed.mock.calls[0][0].error.message).toMatch(/malformed/);
	});

	it('malformed reading_body frame (buffer is a number) emits failed', async () => {
		const payload = basePayload();
		const callbacks = makeCallbacks();
		const frame =
			'event: reading_body\ndata: {"flightId":"flight-1","stage":"reading_body","payload":{"timestamp":1,"buffer":42}}\n\n';

		fetchSpy.mockResolvedValueOnce(buildResponse({ body: streamFromFrames([frame]) }));

		const requester = createAgentRequester(baseUrl, token);
		await requester.start({ payload, signal: new AbortController().signal, callbacks });

		expect(callbacks.heartbeat).not.toHaveBeenCalled();
		expect(callbacks.failed).toHaveBeenCalledTimes(1);
		expect(callbacks.failed.mock.calls[0][0].error.message).toMatch(/malformed reading_body/);
	});

	it('malformed complete frame (missing overview) emits failed', async () => {
		const payload = basePayload();
		const callbacks = makeCallbacks();
		const frame = 'event: complete\ndata: {"flightId":"flight-1","timestamp":1}\n\n';

		fetchSpy.mockResolvedValueOnce(buildResponse({ body: streamFromFrames([frame]) }));

		const requester = createAgentRequester(baseUrl, token);
		await requester.start({ payload, signal: new AbortController().signal, callbacks });

		expect(callbacks.complete).not.toHaveBeenCalled();
		expect(callbacks.failed).toHaveBeenCalledTimes(1);
		expect(callbacks.failed.mock.calls[0][0].error.message).toMatch(/malformed complete/);
	});

	it('malformed failed frame (missing error.message) still fires failed with fallback', async () => {
		const payload = basePayload();
		const callbacks = makeCallbacks();
		// `error` field present but no `message` property → Zod fails, fallback kicks in.
		const frame = 'event: failed\ndata: {"flightId":"flight-1","error":{}}\n\n';

		fetchSpy.mockResolvedValueOnce(buildResponse({ body: streamFromFrames([frame]) }));

		const requester = createAgentRequester(baseUrl, token);
		await requester.start({ payload, signal: new AbortController().signal, callbacks });

		expect(callbacks.failed).toHaveBeenCalledTimes(1);
		expect(callbacks.failed.mock.calls[0][0].error.message).toBe('unknown agent failure');
	});

	it('invalid JSON in SSE data routes through to failed via outer catch', async () => {
		const payload = basePayload();
		const callbacks = makeCallbacks();
		const frame = 'event: fetch_response\ndata: not-json\n\n';

		fetchSpy.mockResolvedValueOnce(buildResponse({ body: streamFromFrames([frame]) }));

		const requester = createAgentRequester(baseUrl, token);
		await requester.start({ payload, signal: new AbortController().signal, callbacks });

		expect(callbacks.failed).toHaveBeenCalledTimes(1);
		expect(callbacks.failed.mock.calls[0][0].error.message).toMatch(/invalid JSON/);
		expect(callbacks.heartbeat).not.toHaveBeenCalled();
	});

	it('unknown event type is ignored silently', async () => {
		const payload = basePayload();
		const callbacks = makeCallbacks();
		const frame = 'event: unknown_thing\ndata: {}\n\n';

		fetchSpy.mockResolvedValueOnce(buildResponse({ body: streamFromFrames([frame]) }));

		const requester = createAgentRequester(baseUrl, token);
		await requester.start({ payload, signal: new AbortController().signal, callbacks });

		expect(callbacks.heartbeat).not.toHaveBeenCalled();
		expect(callbacks.complete).not.toHaveBeenCalled();
		expect(callbacks.failed).not.toHaveBeenCalled();
	});
});

describe('createAgentRequester — cancellation', () => {
	it('pre-aborted signal triggers immediate flight_cancelled without calling fetch', async () => {
		const payload = basePayload();
		const callbacks = makeCallbacks();

		const controller = new AbortController();
		controller.abort();

		const requester = createAgentRequester(baseUrl, token);
		await requester.start({ payload, signal: controller.signal, callbacks });

		expect(fetchSpy).not.toHaveBeenCalled();
		expect(callbacks.failed).toHaveBeenCalledTimes(1);
		expect(callbacks.failed.mock.calls[0][0].error.message).toBe('flight_cancelled');
	});

	it('aborted mid-fetch translates DOMException to flight_cancelled', async () => {
		const payload = basePayload();
		const callbacks = makeCallbacks();
		const controller = new AbortController();

		fetchSpy.mockImplementationOnce(() => {
			// Mirror real fetch: when aborted, signal.aborted is true and fetch rejects.
			controller.abort();
			const err =
				typeof DOMException !== 'undefined'
					? new DOMException('aborted', 'AbortError')
					: Object.assign(new Error('aborted'), { name: 'AbortError' });
			return Promise.reject(err);
		});

		const requester = createAgentRequester(baseUrl, token);
		await requester.start({ payload, signal: controller.signal, callbacks });

		expect(callbacks.failed).toHaveBeenCalledTimes(1);
		expect(callbacks.failed.mock.calls[0][0].error.message).toBe('flight_cancelled');
	});

	it('aborted mid-stream stops emission and surfaces a failure', async () => {
		const payload = basePayload();
		const callbacks = makeCallbacks();
		const controller = new AbortController();
		const { stream, emit, error } = controlledStream();

		fetchSpy.mockResolvedValueOnce(buildResponse({ body: stream }));

		const requester = createAgentRequester(baseUrl, token);

		// Emit one valid heartbeat frame so we know the stream wired up.
		emit('event: fetch_response\ndata: {"flightId":"flight-1","stage":"fetch_response","payload":{"timestamp":1}}\n\n');

		// Kick off the run; we'll abort once the first heartbeat is observed.
		const run = requester.start({ payload, signal: controller.signal, callbacks });

		// Wait for the first heartbeat to land, then abort and tear down the stream.
		await vi.waitFor(() => expect(callbacks.heartbeat).toHaveBeenCalledTimes(1));
		controller.abort();
		error(
			typeof DOMException !== 'undefined'
				? new DOMException('aborted', 'AbortError')
				: Object.assign(new Error('aborted'), { name: 'AbortError' }),
		);

		await run;

		// One heartbeat before abort, one failed afterwards, nothing more.
		expect(callbacks.heartbeat).toHaveBeenCalledTimes(1);
		expect(callbacks.failed).toHaveBeenCalledTimes(1);
		// Abort during SSE consumption surfaces the same `flight_cancelled`
		// message as abort during fetch — the adapter's outer catch checks
		// signal.aborted before rethrowing. Otherwise the renderer would see
		// the underlying DOMException message ("aborted", or the env-specific
		// equivalent) and have to translate it twice.
		expect(callbacks.failed.mock.calls[0][0].error.message).toBe('flight_cancelled');
	});
});
