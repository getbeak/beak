import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { FlightMessages, IpcFlightServiceMain, IpcFlightServiceRenderer } from '../flight';
import type { PartialIpcMain } from '../main';
import type { PartialIpcRenderer } from '../renderer';

interface MockIpcRenderer {
	on: Mock;
	invoke: Mock;
}

interface MockIpcMain {
	handle: Mock;
}

describe('Flight IPC Services - Stage 5', () => {
	describe('IpcFlightServiceRenderer', () => {
		let service: IpcFlightServiceRenderer;
		let mockIpc: MockIpcRenderer;

		beforeEach(() => {
			mockIpc = {
				on: vi.fn(),
				invoke: vi.fn(),
			};
			service = new IpcFlightServiceRenderer(mockIpc as unknown as PartialIpcRenderer);
		});

		describe('constructor', () => {
			it('should initialize with flight channel', () => {
				expect(service).toBeInstanceOf(IpcFlightServiceRenderer);
				// The channel should be 'flight' as defined in the base class
				expect((service as any).channel).toBe('flight');
			});
		});

		describe('startFlight', () => {
			it('should start flight with correct message', async () => {
				const payload = { test: 'data' } as any;
				mockIpc.invoke = vi.fn().mockResolvedValue({ response: undefined });

				await service.startFlight(payload);

				expect(mockIpc.invoke).toHaveBeenCalledWith('flight', {
					code: FlightMessages.StartFlight,
					payload,
				});
			});

			it('should handle successful flight start', async () => {
				mockIpc.invoke = vi.fn().mockResolvedValue({ response: undefined });

				await expect(service.startFlight({ test: 'data' } as any)).resolves.toBeUndefined();
			});

			it('should handle IPC errors during flight start', async () => {
				const error = { error: { message: 'Flight start failed' } };
				mockIpc.invoke = vi.fn().mockResolvedValue(error);

				await expect(service.startFlight({ test: 'data' } as any)).rejects.toThrow('IPC Error');
			});
		});

		describe('registerFlightHeartbeat', () => {
			it('should register heartbeat listener', () => {
				const callback = vi.fn();
				service.registerFlightHeartbeat(callback);

				// Simulate message from main process
				const messageHandler = mockIpc.on.mock.calls[0][1];
				messageHandler({}, { code: FlightMessages.FlightHeartbeat, payload: 'test' });

				expect(callback).toHaveBeenCalledWith({}, 'test');
			});

			it('should handle multiple heartbeat registrations', () => {
				const callback1 = vi.fn();
				const callback2 = vi.fn();

				service.registerFlightHeartbeat(callback1);
				service.registerFlightHeartbeat(callback2);

				// Second registration should overwrite first
				const messageHandler = mockIpc.on.mock.calls[0][1];
				messageHandler({}, { code: FlightMessages.FlightHeartbeat, payload: 'test' });

				expect(callback1).not.toHaveBeenCalled();
				expect(callback2).toHaveBeenCalledWith({}, 'test');
			});
		});

		describe('registerFlightComplete', () => {
			it('should register completion listener', () => {
				const callback = vi.fn();
				service.registerFlightComplete(callback);

				const messageHandler = mockIpc.on.mock.calls[0][1];
				messageHandler({}, { code: FlightMessages.FlightComplete, payload: 'test' });

				expect(callback).toHaveBeenCalledWith({}, 'test');
			});
		});

		describe('registerFlightFailed', () => {
			it('should register failure listener', () => {
				const callback = vi.fn();
				service.registerFlightFailed(callback);

				const messageHandler = mockIpc.on.mock.calls[0][1];
				messageHandler({}, { code: FlightMessages.FlightFailed, payload: 'test' });

				expect(callback).toHaveBeenCalledWith({}, 'test');
			});
		});

		describe('message handling', () => {
			it('should handle all flight message types', () => {
				const heartbeatCallback = vi.fn();
				const completeCallback = vi.fn();
				const failedCallback = vi.fn();

				service.registerFlightHeartbeat(heartbeatCallback);
				service.registerFlightComplete(completeCallback);
				service.registerFlightFailed(failedCallback);

				const messageHandler = mockIpc.on.mock.calls[0][1];

				// Test heartbeat
				messageHandler({}, { code: FlightMessages.FlightHeartbeat, payload: 'heartbeat' });
				expect(heartbeatCallback).toHaveBeenCalledWith({}, 'heartbeat');

				// Test completion
				messageHandler({}, { code: FlightMessages.FlightComplete, payload: 'complete' });
				expect(completeCallback).toHaveBeenCalledWith({}, 'complete');

				// Test failure
				messageHandler({}, { code: FlightMessages.FlightFailed, payload: 'failed' });
				expect(failedCallback).toHaveBeenCalledWith({}, 'failed');
			});

			it('should ignore unregistered message types', () => {
				const callback = vi.fn();
				service.registerFlightHeartbeat(callback);

				const messageHandler = mockIpc.on.mock.calls[0][1];

				// Send unregistered message type
				messageHandler({}, { code: 'unknown_message', payload: 'test' });

				expect(callback).not.toHaveBeenCalled();
			});
		});
	});

	describe('IpcFlightServiceMain', () => {
		let service: IpcFlightServiceMain;
		let mockIpc: MockIpcMain;
		let mockWebContents: any;

		beforeEach(() => {
			mockIpc = { handle: vi.fn() };
			mockWebContents = { send: vi.fn() };
			service = new IpcFlightServiceMain(mockIpc as unknown as PartialIpcMain);
		});

		describe('constructor', () => {
			it('should initialize with flight channel', () => {
				expect(service).toBeInstanceOf(IpcFlightServiceMain);
				expect((service as any).channel).toBe('flight');
			});
		});

		describe('registerStartFlight', () => {
			it('should register start flight handler', () => {
				const handler = vi.fn();
				service.registerStartFlight(handler);

				const requestHandlers = (service as any).requestHandlers;
				expect(requestHandlers.has(FlightMessages.StartFlight)).toBe(true);
			});

			it('should handle flight start requests', async () => {
				const handler = vi.fn().mockResolvedValue(undefined);
				service.registerStartFlight(handler);

				const requestHandler = mockIpc.handle.mock.calls[0][1];
				const validPayload = {
					flightId: 'f-1',
					requestId: 'r-1',
					request: { verb: 'GET', url: ['https://example.com'], body: { type: 'text' } },
				};
				const result = await requestHandler({}, { code: FlightMessages.StartFlight, payload: validPayload });

				expect(handler).toHaveBeenCalledWith({}, validPayload);
				expect(result).toEqual({ response: undefined });
			});

			it('rejects malformed start flight requests via the schema', async () => {
				const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
				const handler = vi.fn();
				service.registerStartFlight(handler);

				const requestHandler = mockIpc.handle.mock.calls[0][1];
				const result = await requestHandler(
					{},
					{
						code: FlightMessages.StartFlight,
						payload: { flightId: '', requestId: 'r-1' }, // missing request, empty flightId
					},
				);

				expect(result.error?.code).toBe('IPC_ERROR');
				expect(handler).not.toHaveBeenCalled();
				errSpy.mockRestore();
			});
		});

		describe('sendHeartbeat', () => {
			it('should send heartbeat message', () => {
				const payload = { flightId: '123', progress: '50%' } as any;
				service.sendHeartbeat(mockWebContents, payload);

				expect(mockWebContents.send).toHaveBeenCalledWith('flight', {
					code: FlightMessages.FlightHeartbeat,
					payload,
					timestamp: expect.any(Number),
				});
			});

			it('should include correct message code', () => {
				service.sendHeartbeat(mockWebContents, 'test' as any);

				const sentCall = mockWebContents.send.mock.calls[0];
				expect(sentCall[1].code).toBe(FlightMessages.FlightHeartbeat);
			});
		});

		describe('sendComplete', () => {
			it('should send completion message', () => {
				const payload = { flightId: '123', result: 'success' } as any;
				service.sendComplete(mockWebContents, payload);

				expect(mockWebContents.send).toHaveBeenCalledWith('flight', {
					code: FlightMessages.FlightComplete,
					payload,
					timestamp: expect.any(Number),
				});
			});

			it('should include correct message code', () => {
				service.sendComplete(mockWebContents, 'test' as any);

				const sentCall = mockWebContents.send.mock.calls[0];
				expect(sentCall[1].code).toBe(FlightMessages.FlightComplete);
			});
		});

		describe('sendFailed', () => {
			it('should send failure message', () => {
				const payload = { flightId: '123', error: 'Network error' } as any;
				service.sendFailed(mockWebContents, payload);

				expect(mockWebContents.send).toHaveBeenCalledWith('flight', {
					code: FlightMessages.FlightFailed,
					payload,
					timestamp: expect.any(Number),
				});
			});

			it('should include correct message code', () => {
				service.sendFailed(mockWebContents, 'test' as any);

				const sentCall = mockWebContents.send.mock.calls[0];
				expect(sentCall[1].code).toBe(FlightMessages.FlightFailed);
			});
		});

		describe('message sending consistency', () => {
			it('should send all message types to the same channel', () => {
				const payload = 'test_payload' as any;

				service.sendHeartbeat(mockWebContents, payload);
				service.sendComplete(mockWebContents, payload);
				service.sendFailed(mockWebContents, payload);

				const calls = mockWebContents.send.mock.calls;
				expect(calls).toHaveLength(3);

				calls.forEach((call: any) => {
					expect(call[0]).toBe('flight');
				});
			});

			it('should maintain consistent message structure', () => {
				const payload = { test: 'data' } as any;

				service.sendHeartbeat(mockWebContents, payload);

				const sentMessage = mockWebContents.send.mock.calls[0][1];
				expect(sentMessage).toHaveProperty('code');
				expect(sentMessage).toHaveProperty('payload');
				expect(typeof sentMessage.code).toBe('string');
			});
		});
	});

	describe('FlightMessages constants', () => {
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

		it('should have consistent naming convention', () => {
			const messageValues = Object.values(FlightMessages);
			messageValues.forEach(value => {
				expect(value).toMatch(/^[a-z_]+$/);
			});
		});
	});

	describe('Integration scenarios', () => {
		it('should handle complete flight lifecycle', async () => {
			// Wire the renderer's invoke to the main's registered handle so the two
			// services actually exchange messages through the same mock transport.
			const mainHandle = vi.fn();
			const mockIpcMain = { handle: mainHandle };
			const mockWebContents = { send: vi.fn() };
			const mainService = new IpcFlightServiceMain(mockIpcMain as unknown as PartialIpcMain);

			const rendererOn = vi.fn();
			const rendererInvoke = vi.fn(async (channel: string, payload: any) => {
				const handlerCall = mainHandle.mock.calls.find(([c]) => c === channel);
				if (!handlerCall) throw new Error(`No main handler for channel ${channel}`);
				return handlerCall[1]({}, payload);
			});
			const mockIpcRenderer = { on: rendererOn, invoke: rendererInvoke };
			const rendererService = new IpcFlightServiceRenderer(mockIpcRenderer as unknown as PartialIpcRenderer);

			const startFlightHandler = vi.fn().mockImplementation(async () => {
				mainService.sendHeartbeat(mockWebContents as any, { flightId: '123', progress: '25%' } as any);
				mainService.sendComplete(mockWebContents as any, { flightId: '123', result: 'success' } as any);
			});
			mainService.registerStartFlight(startFlightHandler);

			const heartbeatCallback = vi.fn();
			const completeCallback = vi.fn();
			rendererService.registerFlightHeartbeat(heartbeatCallback);
			rendererService.registerFlightComplete(completeCallback);

			const validFlight = {
				flightId: 'f-1',
				requestId: 'r-1',
				request: { verb: 'GET', url: ['https://example.com'], body: { type: 'text' } },
			} as any;
			await rendererService.startFlight(validFlight);

			expect(startFlightHandler).toHaveBeenCalledWith(expect.anything(), validFlight);

			const messageHandler = rendererOn.mock.calls[0][1];
			messageHandler({}, { code: FlightMessages.FlightHeartbeat, payload: { flightId: '123', progress: '25%' } });
			messageHandler({}, { code: FlightMessages.FlightComplete, payload: { flightId: '123', result: 'success' } });

			expect(heartbeatCallback).toHaveBeenCalledWith({}, { flightId: '123', progress: '25%' });
			expect(completeCallback).toHaveBeenCalledWith({}, { flightId: '123', result: 'success' });

			// Verify main process sent messages
			expect(mockWebContents.send).toHaveBeenCalledTimes(2);
		});
	});
});
