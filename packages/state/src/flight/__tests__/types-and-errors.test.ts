import { describe, expect, it } from 'vitest';

import {
	createFlightError,
	FlightCancelledError,
	FlightError,
	FlightNetworkError,
	FlightUnknownError,
	FlightValidationError,
	isFlightError,
	isRetryableError,
} from '../errors';

describe('flight errors', () => {
	it('FlightValidationError carries code and is not retryable', () => {
		const err = new FlightValidationError('bad request');
		expect(err).toBeInstanceOf(FlightError);
		expect(err.code).toBe('VALIDATION_ERROR');
		expect(err.isRetryable).toBe(false);
		expect(err.message).toBe('bad request');
	});

	it('FlightNetworkError is retryable', () => {
		const err = new FlightNetworkError('conn refused');
		expect(err.code).toBe('NETWORK_ERROR');
		expect(err.isRetryable).toBe(true);
	});

	it('FlightCancelledError defaults its message', () => {
		const err = new FlightCancelledError();
		expect(err.message).toBe('Flight was cancelled');
	});

	it('createFlightError dispatches on code', () => {
		expect(createFlightError('VALIDATION_ERROR', 'x')).toBeInstanceOf(FlightValidationError);
		expect(createFlightError('NETWORK_ERROR', 'x')).toBeInstanceOf(FlightNetworkError);
		expect(createFlightError('UNKNOWN_ERROR', 'x')).toBeInstanceOf(FlightUnknownError);
	});

	it('isFlightError identifies FlightError instances', () => {
		expect(isFlightError(new FlightValidationError('x'))).toBe(true);
		expect(isFlightError(new Error('x'))).toBe(false);
		expect(isFlightError(null)).toBe(false);
		expect(isFlightError('boom')).toBe(false);
	});

	it('isRetryableError uses isRetryable', () => {
		expect(isRetryableError(new FlightNetworkError('x'))).toBe(true);
		expect(isRetryableError(new FlightValidationError('x'))).toBe(false);
		expect(isRetryableError(new Error('x'))).toBe(false);
	});
});
