import { describe, expect, it } from 'vitest';

import {
	beginFlightRequest,
	cancelFlightRequest,
	completeFlight,
	flightFailure,
	nextFlightHistory,
	previousFlightHistory,
	updateFlightProgress,
} from '../actions';
import flightReducer, { clearFlightData, resetFlightState, setFlightHistory } from '../flight-slice';
import type { FlightHistory, FlightRequest } from '../types';

function makeRequest(): FlightRequest {
	return {
		verb: 'GET',
		url: ['https://example.com'],
		query: {},
		headers: {},
		body: { type: 'text', payload: '' },
		options: { followRedirects: true },
	};
}

function beginPayload(requestId: string, flightId: string) {
	return {
		requestId,
		flightId,
		binaryStoreKey: `bin-${flightId}`,
		request: makeRequest(),
		redirectDepth: 0,
		reason: 'manual' as const,
		showProgress: true,
		showResult: true,
	};
}

const emptyState = flightReducer(undefined, { type: '@@INIT' });

describe('flightSlice', () => {
	it('starts empty', () => {
		expect(emptyState).toEqual({
			flightStates: {},
			flightHistories: {},
			activeFlights: {},
			flightsByRequest: {},
			loading: {},
			errors: {},
		});
	});

	it('beginFlightRequest creates active flight keyed by flightId and indexes it', () => {
		const next = flightReducer(emptyState, beginFlightRequest(beginPayload('r1', 'f1')));
		const active = next.activeFlights.f1;
		expect(active.flightId).toBe('f1');
		expect(active.requestId).toBe('r1');
		expect(active.flighting).toBe(true);
		expect(active.binaryStoreKey).toBe('bin-f1');
		expect(next.flightsByRequest.r1).toEqual(['f1']);
		expect(next.flightStates.r1?.status).toBe('executing');
		expect(next.loading.r1).toBe(true);
	});

	it('updateFlightProgress mutates active flight on parsing_response', () => {
		const begun = flightReducer(emptyState, beginFlightRequest(beginPayload('r1', 'f1')));
		const next = flightReducer(
			begun,
			updateFlightProgress({
				requestId: 'r1',
				flightId: 'f1',
				heartbeat: { stage: 'parsing_response', payload: { timestamp: 1234, contentLength: 100 } },
			}),
		);
		expect(next.activeFlights.f1?.contentLength).toBe(100);
		expect(next.activeFlights.f1?.timing.headersEnd).toBe(1234);
	});

	it('updateFlightProgress accumulates reading_body bytes', () => {
		const begun = flightReducer(emptyState, beginFlightRequest(beginPayload('r1', 'f1')));
		const parsed = flightReducer(
			begun,
			updateFlightProgress({
				requestId: 'r1',
				flightId: 'f1',
				heartbeat: { stage: 'parsing_response', payload: { timestamp: 1, contentLength: 100 } },
			}),
		);
		const chunk = flightReducer(
			parsed,
			updateFlightProgress({
				requestId: 'r1',
				flightId: 'f1',
				heartbeat: { stage: 'reading_body', payload: { timestamp: 2, buffer: new Uint8Array(30) } },
			}),
		);
		expect(chunk.activeFlights.f1?.bodyTransferred).toBe(30);
		expect(chunk.activeFlights.f1?.bodyTransferPercentage).toBe(30);
	});

	it('updateFlightProgress ignores mismatched flightId', () => {
		const begun = flightReducer(emptyState, beginFlightRequest(beginPayload('r1', 'f1')));
		const next = flightReducer(
			begun,
			updateFlightProgress({
				requestId: 'r1',
				flightId: 'other',
				heartbeat: { stage: 'fetch_response', payload: { timestamp: 7 } },
			}),
		);
		expect(next.activeFlights.f1?.timing.requestStart).toBeUndefined();
	});

	it('completeFlight moves entry to history and removes the flight from active', () => {
		const begun = flightReducer(emptyState, beginFlightRequest(beginPayload('r1', 'f1')));
		const next = flightReducer(
			begun,
			completeFlight({
				requestId: 'r1',
				flightId: 'f1',
				response: { status: 200 } as any,
				timestamp: 999,
			}),
		);

		expect(next.activeFlights.f1).toBeUndefined();
		expect(next.flightsByRequest.r1).toBeUndefined();
		expect(next.flightHistories.r1?.selected).toBe('f1');
		expect(next.flightHistories.r1?.history.f1?.response?.status).toBe(200);
		expect(next.flightHistories.r1?.metadata.totalFlights).toBe(1);
		expect(next.flightHistories.r1?.metadata.successfulExecutions).toBe(1);
		expect(next.flightHistories.r1?.metadata.successRate).toBe(100);
		expect(next.flightStates.r1?.status).toBe('completed');
		expect(next.loading.r1).toBe(false);
	});

	it('flightFailure stores entry with error and tracks success rate', () => {
		const begun = flightReducer(emptyState, beginFlightRequest(beginPayload('r1', 'f1')));
		const failed = flightReducer(
			begun,
			flightFailure({
				requestId: 'r1',
				flightId: 'f1',
				error: new Error('boom'),
			}),
		);

		expect(failed.activeFlights.f1).toBeUndefined();
		expect(failed.flightHistories.r1?.history.f1?.error?.message).toBe('boom');
		expect(failed.flightHistories.r1?.metadata.totalFlights).toBe(1);
		expect(failed.flightHistories.r1?.metadata.successfulExecutions).toBe(0);
		expect(failed.flightHistories.r1?.metadata.successRate).toBe(0);
		expect(failed.errors.r1?.message).toBe('boom');
	});

	it('supports two concurrent flights for the same request', () => {
		const begun1 = flightReducer(emptyState, beginFlightRequest(beginPayload('r1', 'f1')));
		const begun2 = flightReducer(begun1, beginFlightRequest(beginPayload('r1', 'f2')));

		expect(begun2.activeFlights.f1).toBeDefined();
		expect(begun2.activeFlights.f2).toBeDefined();
		expect(begun2.flightsByRequest.r1).toEqual(['f1', 'f2']);
		expect(begun2.loading.r1).toBe(true);

		// Complete only f1 — f2 keeps running.
		const afterF1 = flightReducer(
			begun2,
			completeFlight({ requestId: 'r1', flightId: 'f1', response: { status: 200 } as any, timestamp: 5 }),
		);
		expect(afterF1.activeFlights.f1).toBeUndefined();
		expect(afterF1.activeFlights.f2).toBeDefined();
		expect(afterF1.flightsByRequest.r1).toEqual(['f2']);
		expect(afterF1.loading.r1).toBe(true);

		// Then f2 finishes — loading clears.
		const afterF2 = flightReducer(
			afterF1,
			completeFlight({ requestId: 'r1', flightId: 'f2', response: { status: 200 } as any, timestamp: 6 }),
		);
		expect(afterF2.flightsByRequest.r1).toBeUndefined();
		expect(afterF2.loading.r1).toBe(false);
	});

	it('supports concurrent flights across different requests', () => {
		const a = flightReducer(emptyState, beginFlightRequest(beginPayload('r1', 'f1')));
		const b = flightReducer(a, beginFlightRequest(beginPayload('r2', 'f2')));
		expect(b.activeFlights.f1?.requestId).toBe('r1');
		expect(b.activeFlights.f2?.requestId).toBe('r2');
		expect(b.flightsByRequest.r1).toEqual(['f1']);
		expect(b.flightsByRequest.r2).toEqual(['f2']);
		expect(b.loading.r1).toBe(true);
		expect(b.loading.r2).toBe(true);
	});

	it('history navigation walks forwards and backwards', () => {
		let state = flightReducer(emptyState, beginFlightRequest(beginPayload('r1', 'a')));
		state = flightReducer(
			state,
			completeFlight({ requestId: 'r1', flightId: 'a', response: { status: 200 } as any, timestamp: 1 }),
		);
		state = flightReducer(state, beginFlightRequest(beginPayload('r1', 'b')));
		state = flightReducer(
			state,
			completeFlight({ requestId: 'r1', flightId: 'b', response: { status: 201 } as any, timestamp: 2 }),
		);

		expect(state.flightHistories.r1?.selected).toBe('b');
		state = flightReducer(state, previousFlightHistory({ requestId: 'r1' }));
		expect(state.flightHistories.r1?.selected).toBe('a');
		state = flightReducer(state, nextFlightHistory({ requestId: 'r1' }));
		expect(state.flightHistories.r1?.selected).toBe('b');
		// Walking past the end is a no-op.
		state = flightReducer(state, nextFlightHistory({ requestId: 'r1' }));
		expect(state.flightHistories.r1?.selected).toBe('b');
	});

	it('cancelFlightRequest clears all active flights for the request', () => {
		const begun1 = flightReducer(emptyState, beginFlightRequest(beginPayload('r1', 'f1')));
		const begun2 = flightReducer(begun1, beginFlightRequest(beginPayload('r1', 'f2')));
		const cancelled = flightReducer(begun2, cancelFlightRequest('r1'));
		expect(cancelled.activeFlights.f1).toBeUndefined();
		expect(cancelled.activeFlights.f2).toBeUndefined();
		expect(cancelled.flightsByRequest.r1).toBeUndefined();
		expect(cancelled.loading.r1).toBe(false);
	});

	it('setFlightHistory stores history record', () => {
		const history: FlightHistory = {
			selected: undefined,
			history: {},
			metadata: { totalFlights: 0, successfulExecutions: 0, successRate: 0 },
		};
		const next = flightReducer(emptyState, setFlightHistory({ requestId: 'r1', history }));
		expect(next.flightHistories.r1).toEqual(history);
	});

	it('clearFlightData removes per-request entries including active flights', () => {
		const begun = flightReducer(emptyState, beginFlightRequest(beginPayload('r1', 'f1')));
		const cleared = flightReducer(begun, clearFlightData({ requestId: 'r1' }));
		expect(cleared.activeFlights.f1).toBeUndefined();
		expect(cleared.flightsByRequest.r1).toBeUndefined();
		expect(cleared.flightStates.r1).toBeUndefined();
	});

	it('resetFlightState wipes everything', () => {
		const begun = flightReducer(emptyState, beginFlightRequest(beginPayload('r1', 'f1')));
		const reset = flightReducer(begun, resetFlightState());
		expect(reset).toEqual(emptyState);
	});
});
