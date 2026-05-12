/**
 * Flight error codes for different types of flight failures
 */
export type FlightErrorCode =
	| 'VALIDATION_ERROR'
	| 'NETWORK_ERROR'
	| 'TIMEOUT_ERROR'
	| 'CANCELLATION_ERROR'
	| 'REDIRECT_ERROR'
	| 'UNKNOWN_ERROR';

/**
 * Base class for all flight-related errors
 */
export abstract class FlightError extends Error {
	abstract readonly code: FlightErrorCode;
	abstract readonly isRetryable: boolean;

	constructor(
		message: string,
		public readonly details?: Record<string, unknown>,
	) {
		super(message);
		this.name = this.constructor.name;
	}
}

/**
 * Error thrown when flight request validation fails
 */
export class FlightValidationError extends FlightError {
	readonly code: FlightErrorCode = 'VALIDATION_ERROR';
	readonly isRetryable = false;

	constructor(
		message: string,
		public readonly requestId?: string,
		details?: Record<string, unknown>,
	) {
		super(message, { ...details, requestId });
	}
}

/**
 * Error thrown when network/connection issues occur
 */
export class FlightNetworkError extends FlightError {
	readonly code: FlightErrorCode = 'NETWORK_ERROR';
	readonly isRetryable = true;

	constructor(
		message: string,
		public readonly statusCode?: number,
		public readonly url?: string,
		details?: Record<string, unknown>,
	) {
		super(message, { ...details, statusCode, url });
	}
}

/**
 * Error thrown when flight times out
 */
export class FlightTimeoutError extends FlightError {
	readonly code: FlightErrorCode = 'TIMEOUT_ERROR';
	readonly isRetryable = true;

	constructor(
		message: string,
		public readonly timeoutMs: number,
		details?: Record<string, unknown>,
	) {
		super(message, { ...details, timeoutMs });
	}
}

/**
 * Error thrown when flight is cancelled
 */
export class FlightCancelledError extends FlightError {
	readonly code: FlightErrorCode = 'CANCELLATION_ERROR';
	readonly isRetryable = false;

	constructor(
		message: string = 'Flight was cancelled',
		public readonly reason?: string,
		details?: Record<string, unknown>,
	) {
		super(message, { ...details, reason });
	}
}

/**
 * Error thrown when redirect limit is exceeded
 */
export class FlightRedirectError extends FlightError {
	readonly code: FlightErrorCode = 'REDIRECT_ERROR';
	readonly isRetryable = false;

	constructor(
		message: string,
		public readonly redirectCount: number,
		public readonly maxRedirects: number,
		details?: Record<string, unknown>,
	) {
		super(message, { ...details, redirectCount, maxRedirects });
	}
}

/**
 * Error thrown for unknown/unexpected errors
 */
export class FlightUnknownError extends FlightError {
	readonly code: FlightErrorCode = 'UNKNOWN_ERROR';
	readonly isRetryable = false;

	constructor(
		message: string,
		public readonly originalError?: Error,
		details?: Record<string, unknown>,
	) {
		super(message, { ...details, originalError: originalError?.message });
	}
}

/**
 * Factory function to create appropriate error based on context
 */
export function createFlightError(
	code: FlightErrorCode,
	message: string,
	context?: Record<string, unknown>,
): FlightError {
	switch (code) {
		case 'VALIDATION_ERROR':
			return new FlightValidationError(message, undefined, context);
		case 'NETWORK_ERROR':
			return new FlightNetworkError(message, undefined, undefined, context);
		case 'TIMEOUT_ERROR':
			return new FlightTimeoutError(message, 0, context);
		case 'CANCELLATION_ERROR':
			return new FlightCancelledError(message, undefined, context);
		case 'REDIRECT_ERROR':
			return new FlightRedirectError(message, 0, 0, context);
		case 'UNKNOWN_ERROR':
			return new FlightUnknownError(message, undefined, context);
		default:
			return new FlightUnknownError(message, undefined, context);
	}
}

/**
 * Checks if an error is a flight error
 */
export function isFlightError(error: unknown): error is FlightError {
	return error instanceof FlightError;
}

/**
 * Checks if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
	return isFlightError(error) && error.isRetryable;
}
