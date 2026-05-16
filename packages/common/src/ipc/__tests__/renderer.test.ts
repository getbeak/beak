import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { IpcServiceRenderer, type PartialIpcRenderer } from '../renderer';

interface MockIpcRenderer {
	on: Mock;
	invoke: Mock;
}

class TestRendererService extends IpcServiceRenderer<'test'> {
	constructor(ipc: PartialIpcRenderer) {
		super('test', ipc);
	}

	async testInvoke(code: string, payload?: unknown) {
		return this.invoke(code, payload);
	}

	testRegisterListener(messageType: string, listener: any) {
		this.registerListener(messageType, listener);
	}

	testGetListeners() {
		return (this as any).listeners;
	}
}

describe('IpcServiceRenderer - Stage 3', () => {
	let service: TestRendererService;
	let mockIpc: MockIpcRenderer;

	beforeEach(() => {
		mockIpc = {
			on: vi.fn(),
			invoke: vi.fn(),
		};
		service = new TestRendererService(mockIpc as unknown as PartialIpcRenderer);
	});

	describe('constructor', () => {
		it('should setup message handling on construction', () => {
			expect(mockIpc.on).toHaveBeenCalledWith('test', expect.any(Function));
		});

		it('should call setupMessageHandling', () => {
			expect(mockIpc.on).toHaveBeenCalledTimes(1);
		});
	});

	describe('invoke', () => {
		it('should invoke IPC and return response data', async () => {
			const mockResponse = { response: 'test_data' };
			mockIpc.invoke = vi.fn().mockResolvedValue(mockResponse);

			const result = await service.testInvoke('test_code', 'test_payload');

			expect(mockIpc.invoke).toHaveBeenCalledWith('test', {
				code: 'test_code',
				payload: 'test_payload',
			});
			expect(result).toBe('test_data');
		});

		it('should handle responses without response field', async () => {
			const mockResponse = { other: 'data' };
			mockIpc.invoke = vi.fn().mockResolvedValue(mockResponse);

			const result = await service.testInvoke('test_code');

			expect(result).toBeUndefined();
		});

		it('should handle IPC errors gracefully', async () => {
			const mockError = { error: { message: 'Test error' } };
			mockIpc.invoke = vi.fn().mockResolvedValue(mockError);

			await expect(service.testInvoke('test_code')).rejects.toThrow('IPC Error: Test error');
		});

		it('preserves the host-side error code on the thrown Error', async () => {
			const mockError = { error: { code: 'ENOENT', message: 'no such file' } };
			mockIpc.invoke = vi.fn().mockResolvedValue(mockError);

			await expect(service.testInvoke('test_code')).rejects.toMatchObject({
				code: 'ENOENT',
				message: 'IPC Error: no such file',
			});
		});

		it('should handle network errors', async () => {
			const networkError = new Error('Network error');
			mockIpc.invoke = vi.fn().mockRejectedValue(networkError);

			await expect(service.testInvoke('test_code')).rejects.toThrow('Network error');
		});

		it('should handle string errors', async () => {
			mockIpc.invoke = vi.fn().mockRejectedValue('String error');

			await expect(service.testInvoke('test_code')).rejects.toThrow('String error');
		});

		it('should handle unknown error types', async () => {
			mockIpc.invoke = vi.fn().mockRejectedValue(123);

			await expect(service.testInvoke('test_code')).rejects.toThrow('Unknown IPC error');
		});

		it('should handle null/undefined responses', async () => {
			mockIpc.invoke = vi.fn().mockResolvedValue(null);

			const result = await service.testInvoke('test_code');
			expect(result).toBeUndefined();
		});
	});

	describe('message handling', () => {
		it('should handle valid messages correctly', () => {
			const mockListener = vi.fn();
			service.testRegisterListener('test_message', mockListener);

			// Get the message handler that was registered
			const messageHandler = mockIpc.on.mock.calls[0][1];

			// Simulate receiving a message
			messageHandler({}, { code: 'test_message', payload: 'test_payload' });

			expect(mockListener).toHaveBeenCalledWith({}, 'test_payload');
		});

		it('should handle malformed messages gracefully', () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			// Get the message handler
			const messageHandler = mockIpc.on.mock.calls[0][1];

			// Simulate malformed message
			messageHandler({}, { code: '', payload: 'test' });

			expect(consoleSpy).toHaveBeenCalledWith('Malformed IPC message received:', { code: '', payload: 'test' });

			consoleSpy.mockRestore();
		});

		it('should handle messages without code', () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			const messageHandler = mockIpc.on.mock.calls[0][1];
			messageHandler({}, { payload: 'test' });

			expect(consoleSpy).toHaveBeenCalledWith('Malformed IPC message received:', { payload: 'test' });

			consoleSpy.mockRestore();
		});

		it('should warn when no listener is registered', () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			const messageHandler = mockIpc.on.mock.calls[0][1];
			messageHandler({}, { code: 'unregistered_message', payload: 'test' });

			expect(consoleSpy).toHaveBeenCalledWith('No listener for message: unregistered_message');

			consoleSpy.mockRestore();
		});

		it('should handle multiple listeners for different messages', () => {
			const listener1 = vi.fn();
			const listener2 = vi.fn();

			service.testRegisterListener('msg1', listener1);
			service.testRegisterListener('msg2', listener2);

			const messageHandler = mockIpc.on.mock.calls[0][1];

			messageHandler({}, { code: 'msg1', payload: 'payload1' });
			messageHandler({}, { code: 'msg2', payload: 'payload2' });

			expect(listener1).toHaveBeenCalledWith({}, 'payload1');
			expect(listener2).toHaveBeenCalledWith({}, 'payload2');
		});
	});

	describe('error normalization', () => {
		it('should preserve Error instances', async () => {
			const originalError = new Error('Original error');
			mockIpc.invoke = vi.fn().mockRejectedValue(originalError);

			await expect(service.testInvoke('test_code')).rejects.toBe(originalError);
		});

		it('should convert string errors to Error instances', async () => {
			mockIpc.invoke = vi.fn().mockRejectedValue('String error');

			await expect(service.testInvoke('test_code')).rejects.toThrow('String error');
		});

		it('should handle unknown error types', async () => {
			mockIpc.invoke = vi.fn().mockRejectedValue({ custom: 'error' });

			await expect(service.testInvoke('test_code')).rejects.toThrow('Unknown IPC error');
		});
	});

	describe('edge cases', () => {
		it('should handle empty payloads', async () => {
			const mockResponse = { response: 'data' };
			mockIpc.invoke = vi.fn().mockResolvedValue(mockResponse);

			const result = await service.testInvoke('test_code', '');
			expect(result).toBe('data');
		});

		it('should handle undefined payloads', async () => {
			const mockResponse = { response: 'data' };
			mockIpc.invoke = vi.fn().mockResolvedValue(mockResponse);

			const result = await service.testInvoke('test_code', undefined);
			expect(result).toBe('data');
		});

		it('should handle complex payloads', async () => {
			const complexPayload = { nested: { data: [1, 2, 3] } };
			const mockResponse = { response: 'success' };
			mockIpc.invoke = vi.fn().mockResolvedValue(mockResponse);

			const result = await service.testInvoke('test_code', complexPayload);
			expect(result).toBe('success');
		});
	});
});
