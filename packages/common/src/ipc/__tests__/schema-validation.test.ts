import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { z } from 'zod';

import { IpcServiceBase } from '../base';
import { IpcServiceMain, type PartialIpcMain } from '../main';
import type { IpcMessage } from '../types';

const greetingSchema = z.object({
	name: z.string().min(1),
	loud: z.boolean().optional(),
});

type Greeting = z.infer<typeof greetingSchema>;

class TestBase extends IpcServiceBase<'test'> {
	constructor() {
		super('test');
	}
	exposeRegister<P>(messageType: string, handler: (event: any, payload: P) => void, schema?: any) {
		this.registerListener(messageType, handler, schema);
	}
	dispatch(messageType: string, payload: unknown) {
		const listener = this.listeners.get(messageType);
		if (!listener) throw new Error(`no listener for ${messageType}`);
		return listener({}, payload);
	}
}

class TestMain extends IpcServiceMain<'test'> {
	constructor(ipc: PartialIpcMain) {
		super('test', ipc);
	}
	registerWithSchema<P>(messageType: string, handler: (event: any, payload: P) => any, schema?: any) {
		this.registerRequestHandler(messageType, handler, schema);
	}
}

describe('IPC payload validation', () => {
	describe('registerListener with schema', () => {
		it('passes a valid payload through to the handler', async () => {
			const base = new TestBase();
			const handler = vi.fn();
			base.exposeRegister<Greeting>('greet', handler, greetingSchema);

			await base.dispatch('greet', { name: 'Alex' });
			expect(handler).toHaveBeenCalledWith({}, { name: 'Alex' });
		});

		it('parses (does not just validate) — handler sees the parsed value', async () => {
			const base = new TestBase();
			const handler = vi.fn();
			// .strip() drops unknown keys.
			const strict = z.object({ name: z.string() }).strip();
			base.exposeRegister('greet', handler, strict);

			await base.dispatch('greet', { name: 'Alex', extra: 'dropped' });
			expect(handler).toHaveBeenCalledWith({}, { name: 'Alex' });
		});

		it('throws on an invalid payload — handler is not called', async () => {
			const base = new TestBase();
			const handler = vi.fn();
			base.exposeRegister<Greeting>('greet', handler, greetingSchema);

			await expect(async () => base.dispatch('greet', { name: '' })).rejects.toBeDefined();
			expect(handler).not.toHaveBeenCalled();
		});

		it('non-schema registrations still work unchanged', async () => {
			const base = new TestBase();
			const handler = vi.fn();
			base.exposeRegister('passthrough', handler);

			await base.dispatch('passthrough', { anything: 'goes' });
			expect(handler).toHaveBeenCalledWith({}, { anything: 'goes' });
		});

		it('accepts non-zod schemas that match the IpcSchema<T> shape', async () => {
			const base = new TestBase();
			const handler = vi.fn();
			const customSchema = {
				parse(input: unknown) {
					if (typeof input !== 'string') throw new Error('expected string');
					return input.toUpperCase();
				},
			};
			base.exposeRegister<string>('shout', handler, customSchema);

			await base.dispatch('shout', 'hello');
			expect(handler).toHaveBeenCalledWith({}, 'HELLO');
		});
	});

	describe('IpcServiceMain.registerRequestHandler with schema', () => {
		let mockIpc: { handle: Mock };
		let service: TestMain;
		let handle: (
			event: any,
			message: IpcMessage,
		) => Promise<{ response?: unknown; error?: { code: string; message: string } }>;

		beforeEach(() => {
			mockIpc = { handle: vi.fn() };
			service = new TestMain(mockIpc as unknown as PartialIpcMain);
			handle = mockIpc.handle.mock.calls[0][1];
		});

		it('valid payload reaches the handler and the response is returned', async () => {
			const handler = vi.fn().mockResolvedValue('ok');
			service.registerWithSchema<Greeting>('greet', handler, greetingSchema);

			const result = await handle({}, { code: 'greet', payload: { name: 'Alex' } });
			expect(result).toEqual({ response: 'ok' });
			expect(handler).toHaveBeenCalledWith({}, { name: 'Alex' });
		});

		it('invalid payload yields an IpcError response, handler not called', async () => {
			const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const handler = vi.fn();
			service.registerWithSchema<Greeting>('greet', handler, greetingSchema);

			const result = await handle({}, { code: 'greet', payload: { name: 123 } });
			expect(result.error?.code).toBe('IPC_ERROR');
			expect(handler).not.toHaveBeenCalled();
			errSpy.mockRestore();
		});
	});
});
