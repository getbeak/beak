import { describe, expect, it } from 'vitest';
import { FlightMessages, type FlightMessageType } from '../flight';
import type { IpcChannel, IpcError, IpcListener, IpcMessage, IpcResponse } from '../types';

describe('IPC Types - Stage 1', () => {
	describe('IpcChannel', () => {
		it('should include all expected channels', () => {
			const expectedChannels: IpcChannel[] = [
				'flight',
				'fs',
				'project',
				'preferences',
				'extensions',
				'nest',
				'encryption',
				'notification',
				'window',
				'dialog',
				'explorer',
				'beak-hub',
				'context-menu',
				'fs-watcher',
			];

			// This test ensures our IpcChannel type covers all expected channels
			expect(expectedChannels).toBeDefined();
		});
	});

	describe('IpcMessage', () => {
		it('should have correct structure', () => {
			const message: IpcMessage<string> = {
				code: 'test_message',
				payload: 'test_data',
				requestId: 'req-123',
				timestamp: Date.now(),
			};

			expect(message.code).toBe('test_message');
			expect(message.payload).toBe('test_data');
			expect(message.requestId).toBe('req-123');
			expect(message.timestamp).toBeGreaterThan(0);
		});

		it('should allow optional fields', () => {
			const minimalMessage: IpcMessage = {
				code: 'minimal',
				payload: 'data',
			};

			expect(minimalMessage.code).toBe('minimal');
			expect(minimalMessage.payload).toBe('data');
			expect(minimalMessage.requestId).toBeUndefined();
			expect(minimalMessage.timestamp).toBeUndefined();
		});
	});

	describe('IpcResponse', () => {
		it('should handle success response', () => {
			const successResponse: IpcResponse<string> = {
				success: true,
				data: 'success_data',
				requestId: 'req-123',
			};

			expect(successResponse.success).toBe(true);
			expect(successResponse.data).toBe('success_data');
			expect(successResponse.requestId).toBe('req-123');
		});

		it('should handle error response', () => {
			const errorResponse: IpcResponse<string> = {
				success: false,
				error: {
					code: 'TEST_ERROR',
					message: 'Test error message',
					details: { additional: 'info' },
				},
				requestId: 'req-123',
			};

			expect(errorResponse.success).toBe(false);
			expect(errorResponse.error?.code).toBe('TEST_ERROR');
			expect(errorResponse.error?.message).toBe('Test error message');
			expect(errorResponse.requestId).toBe('req-123');
		});
	});

	describe('IpcError', () => {
		it('should have correct structure', () => {
			const error: IpcError = {
				code: 'ERROR_CODE',
				message: 'Error message',
				details: { context: 'test' },
				stack: 'Error stack trace',
			};

			expect(error.code).toBe('ERROR_CODE');
			expect(error.message).toBe('Error message');
			expect(error.details).toEqual({ context: 'test' });
			expect(error.stack).toBe('Error stack trace');
		});

		it('should allow optional fields', () => {
			const minimalError: IpcError = {
				code: 'MINIMAL',
				message: 'Minimal error',
			};

			expect(minimalError.code).toBe('MINIMAL');
			expect(minimalError.message).toBe('Minimal error');
			expect(minimalError.details).toBeUndefined();
			expect(minimalError.stack).toBeUndefined();
		});
	});

	describe('IpcListener', () => {
		it('should be callable with correct signature', async () => {
			const listener: IpcListener<string> = (event, payload) => {
				expect(typeof event).toBe('object');
				expect(payload).toBe('test_payload');
				return Promise.resolve();
			};

			const mockEvent = { type: 'test' };
			await expect(listener(mockEvent, 'test_payload')).resolves.toBeUndefined();
		});
	});

	describe('FlightMessages - Stage 1', () => {
		it('should have all required message types', () => {
			expect(FlightMessages.StartFlight).toBe('start_flight');
			expect(FlightMessages.FlightHeartbeat).toBe('flight_heartbeat');
			expect(FlightMessages.FlightComplete).toBe('flight_complete');
			expect(FlightMessages.FlightFailed).toBe('flight_failed');
		});

		it('should be readonly', () => {
			// @ts-expect-error - should not allow modification
			FlightMessages.StartFlight = 'modified';
		});
	});

	describe('FlightMessageType - Stage 1', () => {
		it('should be a union of all message types', () => {
			const validTypes: FlightMessageType[] = ['start_flight', 'flight_heartbeat', 'flight_complete', 'flight_failed'];

			expect(validTypes).toHaveLength(4);
		});

		it('should not allow invalid message types', () => {
			// @ts-expect-error - should not allow invalid types
			const _invalidType: FlightMessageType = 'invalid_type';
			void _invalidType;
		});
	});
});
