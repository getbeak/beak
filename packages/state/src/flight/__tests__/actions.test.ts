import { describe, expect, it } from 'vitest';

import {
	beginFlightRequest,
	cancelFlightRequest,
	completeFlight,
	flightFailure,
	nextFlightHistory,
	previousFlightHistory,
	requestFlight,
	requestPureFlight,
	updateFlightProgress,
} from '../actions';
import type { FlightRequest } from '../types';

const minimalRequest: FlightRequest = {
	verb: 'GET',
	url: ['https://example.com'],
	query: {},
	headers: {},
	body: { type: 'text', payload: '' },
	options: { followRedirects: true },
};

describe('flight intent actions', () => {
	it('requestFlight is a typed action creator', () => {
		const action = requestFlight();
		expect(action.type).toBe('flight/requestFlight');
		expect(requestFlight.toString()).toBe('flight/requestFlight');
	});

	it('requestPureFlight carries its payload', () => {
		const action = requestPureFlight({
			referenceRequestId: 'r1',
			request: minimalRequest,
			reason: 'graphql_schema',
		});
		expect(action.type).toBe('flight/requestPureFlight');
		expect(action.payload.referenceRequestId).toBe('r1');
		expect(action.payload.reason).toBe('graphql_schema');
	});

	it('exposes the full lifecycle action set', () => {
		expect(beginFlightRequest.toString()).toBe('flight/beginFlightRequest');
		expect(updateFlightProgress.toString()).toBe('flight/updateFlightProgress');
		expect(completeFlight.toString()).toBe('flight/completeFlight');
		expect(flightFailure.toString()).toBe('flight/flightFailure');
		expect(cancelFlightRequest.toString()).toBe('flight/cancelFlightRequest');
		expect(nextFlightHistory.toString()).toBe('flight/nextFlightHistory');
		expect(previousFlightHistory.toString()).toBe('flight/previousFlightHistory');
	});
});
