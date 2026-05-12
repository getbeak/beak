import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { IpcServiceMain, type PartialIpcMain } from '../main';

interface MockIpcMain {
	handle: Mock;
}

class TestMainService extends IpcServiceMain<'test'> {
	constructor(ipc: PartialIpcMain) {
		super('test', ipc);
	}

	testRegisterRequestHandler(messageType: string, handler: any) {
		this.registerRequestHandler(messageType, handler);
	}

	testSendMessage(webContents: any, messageType: string, payload: unknown) {
		this.sendMessage(webContents, messageType, payload);
	}

	testGetRequestHandlers() {
		return (this as any).requestHandlers;
	}
}

describe('IpcServiceMain - Stage 4', () => {
	let service: TestMainService;
	let mockIpc: MockIpcMain;
	let mockWebContents: any;

	beforeEach(() => {
		mockIpc = {
			handle: vi.fn(),
		};
		mockWebContents = {
			send: vi.fn(),
		};
		service = new TestMainService(mockIpc as unknown as PartialIpcMain);
	});

	describe('constructor', () => {
		it('should setup request handling on construction', () => {
			expect(mockIpc.handle).toHaveBeenCalledWith('test', expect.any(Function));
		});

		it('should call setupRequestHandling', () => {
			expect(mockIpc.handle).toHaveBeenCalledTimes(1);
		});
	});

	describe('registerRequestHandler', () => {
		it('should register request handlers correctly', () => {
			const handler = vi.fn();
			service.testRegisterRequestHandler('test_message', handler);

			const requestHandlers = service.testGetRequestHandlers();
			expect(requestHandlers.has('test_message')).toBe(true);
		});

		it('should allow multiple handlers for different messages', () => {
			const handler1 = vi.fn();
			const handler2 = vi.fn();

			service.testRegisterRequestHandler('msg1', handler1);
			service.testRegisterRequestHandler('msg2', handler2);

			const requestHandlers = service.testGetRequestHandlers();
			expect(requestHandlers.has('msg1')).toBe(true);
			expect(requestHandlers.has('msg2')).toBe(true);
		});

		it('should overwrite existing handlers for same message', () => {
			const handler1 = vi.fn();
			const handler2 = vi.fn();

			service.testRegisterRequestHandler('test_message', handler1);
			service.testRegisterRequestHandler('test_message', handler2);

			const requestHandlers = service.testGetRequestHandlers();
			expect(requestHandlers.get('test_message')).toBe(handler2);
		});
	});

	describe('sendMessage', () => {
		it('should send messages to web contents correctly', () => {
			const payload = { test: 'data' };
			service.testSendMessage(mockWebContents, 'test_message', payload);

			expect(mockWebContents.send).toHaveBeenCalledWith('test', {
				code: 'test_message',
				payload,
				timestamp: expect.any(Number),
			});
		});

		it('should include timestamp in sent messages', () => {
			const beforeSend = Date.now();
			service.testSendMessage(mockWebContents, 'test_message', 'payload');
			const afterSend = Date.now();

			const sentCall = mockWebContents.send.mock.calls[0];
			const sentMessage = sentCall[1];

			expect(sentMessage.timestamp).toBeGreaterThanOrEqual(beforeSend);
			expect(sentMessage.timestamp).toBeLessThanOrEqual(afterSend);
		});

		it('should handle different payload types', () => {
			const testCases = [
				{ payload: 'string', expected: 'string' },
				{ payload: 123, expected: 123 },
				{ payload: { nested: 'object' }, expected: { nested: 'object' } },
				{ payload: null, expected: null },
				{ payload: undefined, expected: undefined },
			];

			testCases.forEach(({ payload, expected }) => {
				mockWebContents.send.mockClear();
				service.testSendMessage(mockWebContents, 'test_message', payload);

				const sentMessage = mockWebContents.send.mock.calls[0][1];
				expect(sentMessage.payload).toEqual(expected);
			});
		});
	});

	describe('request handling', () => {
		it('should handle valid requests and return responses', async () => {
			const handler = vi.fn().mockResolvedValue('test_response');
			service.testRegisterRequestHandler('test_message', handler);

			const requestHandler = mockIpc.handle.mock.calls[0][1];
			const result = await requestHandler({}, { code: 'test_message', payload: 'test' });

			expect(handler).toHaveBeenCalledWith({}, 'test');
			expect(result).toEqual({ response: 'test_response' });
		});

		it('should handle async handlers', async () => {
			const handler = vi.fn().mockImplementation(async () => {
				await new Promise(resolve => setTimeout(resolve, 10));
				return 'delayed_response';
			});

			service.testRegisterRequestHandler('test_message', handler);

			const requestHandler = mockIpc.handle.mock.calls[0][1];
			const result = await requestHandler({}, { code: 'test_message', payload: 'test' });

			expect(result).toEqual({ response: 'delayed_response' });
		});

		it('should handle handlers that return void', async () => {
			const handler = vi.fn().mockResolvedValue(undefined);
			service.testRegisterRequestHandler('test_message', handler);

			const requestHandler = mockIpc.handle.mock.calls[0][1];
			const result = await requestHandler({}, { code: 'test_message', payload: 'test' });

			expect(result).toEqual({ response: undefined });
		});
	});

	describe('error handling', () => {
		it('should handle malformed messages gracefully', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			const requestHandler = mockIpc.handle.mock.calls[0][1];
			const result = await requestHandler({}, { code: '', payload: 'test' });

			expect(consoleSpy).toHaveBeenCalled();
			expect(result.error).toBeDefined();
			expect(result.error?.code).toBe('IPC_ERROR');
			expect(result.error?.message).toBe('Malformed IPC message');

			consoleSpy.mockRestore();
		});

		it('should handle missing handlers gracefully', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			const requestHandler = mockIpc.handle.mock.calls[0][1];
			const result = await requestHandler({}, { code: 'unregistered_message', payload: 'test' });

			expect(consoleSpy).toHaveBeenCalled();
			expect(result.error).toBeDefined();
			expect(result.error?.code).toBe('IPC_ERROR');
			expect(result.error?.message).toBe('No handler for message: unregistered_message');

			consoleSpy.mockRestore();
		});

		it('should handle handler errors gracefully', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			const handler = vi.fn().mockRejectedValue(new Error('Handler error'));
			service.testRegisterRequestHandler('test_message', handler);

			const requestHandler = mockIpc.handle.mock.calls[0][1];
			const result = await requestHandler({}, { code: 'test_message', payload: 'test' });

			expect(consoleSpy).toHaveBeenCalled();
			expect(result.error).toBeDefined();
			expect(result.error?.code).toBe('IPC_ERROR');
			expect(result.error?.message).toBe('Handler error');

			consoleSpy.mockRestore();
		});

		it('should handle non-Error exceptions', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			const handler = vi.fn().mockRejectedValue('String error');
			service.testRegisterRequestHandler('test_message', handler);

			const requestHandler = mockIpc.handle.mock.calls[0][1];
			const result = await requestHandler({}, { code: 'test_message', payload: 'test' });

			expect(result.error).toBeDefined();
			expect(result.error?.code).toBe('UNKNOWN_ERROR');
			expect(result.error?.message).toBe('String error');

			consoleSpy.mockRestore();
		});
	});

	describe('error normalization', () => {
		it('should preserve Error instances', async () => {
			const originalError = new Error('Original error');
			const handler = vi.fn().mockRejectedValue(originalError);
			service.testRegisterRequestHandler('test_message', handler);

			const requestHandler = mockIpc.handle.mock.calls[0][1];
			const result = await requestHandler({}, { code: 'test_message', payload: 'test' });

			expect(result.error?.code).toBe('IPC_ERROR');
			expect(result.error?.message).toBe('Original error');
			expect(result.error?.stack).toBe(originalError.stack);
		});

		it('should handle unknown error types', async () => {
			const handler = vi.fn().mockRejectedValue({ custom: 'error' });
			service.testRegisterRequestHandler('test_message', handler);

			const requestHandler = mockIpc.handle.mock.calls[0][1];
			const result = await requestHandler({}, { code: 'test_message', payload: 'test' });

			expect(result.error?.code).toBe('UNKNOWN_ERROR');
			expect(result.error?.message).toBe('Unknown error occurred');
			expect(result.error?.details).toEqual({ custom: 'error' });
		});
	});

	describe('edge cases', () => {
		it('should handle empty message codes', async () => {
			const requestHandler = mockIpc.handle.mock.calls[0][1];
			const result = await requestHandler({}, { code: '', payload: 'test' });

			expect(result.error).toBeDefined();
			expect(result.error?.message).toBe('Malformed IPC message');
		});

		it('should handle messages without code property', async () => {
			const requestHandler = mockIpc.handle.mock.calls[0][1];
			const result = await requestHandler({}, { payload: 'test' } as any);

			expect(result.error).toBeDefined();
			expect(result.error?.message).toBe('Malformed IPC message');
		});

		it('should handle null/undefined messages', async () => {
			const requestHandler = mockIpc.handle.mock.calls[0][1];

			const result = await requestHandler({}, null as any);

			expect(result.error).toBeDefined();
			expect(result.error?.code).toBe('IPC_ERROR');
		});
	});
});
