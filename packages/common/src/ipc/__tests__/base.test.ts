import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IpcServiceBase } from '../base';

class TestService extends IpcServiceBase<'test'> {
	constructor() {
		super('test');
	}

	testRegisterListener(messageType: string, listener: any) {
		this.registerListener(messageType, listener);
	}

	testUnregisterListener(messageType: string) {
		this.unregisterListener(messageType);
	}

	testHasListener(messageType: string) {
		return this.hasListener(messageType);
	}

	testGetListenerCount() {
		return this.getListenerCount();
	}

	testClearAllListeners() {
		this.clearAllListeners();
	}

	testGetChannel() {
		return this.getChannel();
	}
}

describe('IpcServiceBase - Stage 2', () => {
	let service: TestService;

	beforeEach(() => {
		service = new TestService();
	});

	describe('constructor', () => {
		it('should initialize with correct channel', () => {
			expect(service.testGetChannel()).toBe('test');
		});
	});

	describe('registerListener', () => {
		it('should register listeners correctly', () => {
			const listener = vi.fn();

			service.testRegisterListener('test_message', listener);

			expect(service.testHasListener('test_message')).toBe(true);
		});

		it('should allow multiple listeners for different messages', () => {
			const listener1 = vi.fn();
			const listener2 = vi.fn();

			service.testRegisterListener('msg1', listener1);
			service.testRegisterListener('msg2', listener2);

			expect(service.testHasListener('msg1')).toBe(true);
			expect(service.testHasListener('msg2')).toBe(true);
			expect(service.testGetListenerCount()).toBe(2);
		});

		it('should overwrite existing listeners for same message', () => {
			const listener1 = vi.fn();
			const listener2 = vi.fn();

			service.testRegisterListener('test_message', listener1);
			service.testRegisterListener('test_message', listener2);

			expect(service.testGetListenerCount()).toBe(1);
		});
	});

	describe('unregisterListener', () => {
		it('should unregister listeners correctly', () => {
			const listener = vi.fn();

			service.testRegisterListener('test_message', listener);
			expect(service.testHasListener('test_message')).toBe(true);

			service.testUnregisterListener('test_message');
			expect(service.testHasListener('test_message')).toBe(false);
		});

		it('should handle unregistering non-existent listeners gracefully', () => {
			expect(() => {
				service.testUnregisterListener('non_existent');
			}).not.toThrow();
		});

		it('should maintain other listeners when unregistering one', () => {
			const listener1 = vi.fn();
			const listener2 = vi.fn();

			service.testRegisterListener('msg1', listener1);
			service.testRegisterListener('msg2', listener2);

			service.testUnregisterListener('msg1');

			expect(service.testHasListener('msg1')).toBe(false);
			expect(service.testHasListener('msg2')).toBe(true);
			expect(service.testGetListenerCount()).toBe(1);
		});
	});

	describe('hasListener', () => {
		it('should return true for registered listeners', () => {
			const listener = vi.fn();
			service.testRegisterListener('test_message', listener);

			expect(service.testHasListener('test_message')).toBe(true);
		});

		it('should return false for unregistered listeners', () => {
			expect(service.testHasListener('non_existent')).toBe(false);
		});

		it('should return false after unregistering', () => {
			const listener = vi.fn();
			service.testRegisterListener('test_message', listener);
			service.testUnregisterListener('test_message');

			expect(service.testHasListener('test_message')).toBe(false);
		});
	});

	describe('getListenerCount', () => {
		it('should return 0 for new service', () => {
			expect(service.testGetListenerCount()).toBe(0);
		});

		it('should return correct count after registering listeners', () => {
			const listener = vi.fn();

			service.testRegisterListener('msg1', listener);
			expect(service.testGetListenerCount()).toBe(1);

			service.testRegisterListener('msg2', listener);
			expect(service.testGetListenerCount()).toBe(2);
		});

		it('should return correct count after unregistering', () => {
			const listener = vi.fn();

			service.testRegisterListener('msg1', listener);
			service.testRegisterListener('msg2', listener);
			expect(service.testGetListenerCount()).toBe(2);

			service.testUnregisterListener('msg1');
			expect(service.testGetListenerCount()).toBe(1);
		});
	});

	describe('clearAllListeners', () => {
		it('should remove all listeners', () => {
			const listener = vi.fn();

			service.testRegisterListener('msg1', listener);
			service.testRegisterListener('msg2', listener);
			expect(service.testGetListenerCount()).toBe(2);

			service.testClearAllListeners();
			expect(service.testGetListenerCount()).toBe(0);
		});

		it('should handle clearing empty service', () => {
			expect(() => {
				service.testClearAllListeners();
			}).not.toThrow();

			expect(service.testGetListenerCount()).toBe(0);
		});
	});

	describe('getChannel', () => {
		it('should return the correct channel', () => {
			expect(service.testGetChannel()).toBe('test');
		});

		it('should return the same channel instance', () => {
			const channel1 = service.testGetChannel();
			const channel2 = service.testGetChannel();

			expect(channel1).toBe(channel2);
		});
	});

	describe('edge cases', () => {
		it('should handle empty string message types', () => {
			const listener = vi.fn();

			service.testRegisterListener('', listener);
			expect(service.testHasListener('')).toBe(true);

			service.testUnregisterListener('');
			expect(service.testHasListener('')).toBe(false);
		});

		it('should handle special characters in message types', () => {
			const listener = vi.fn();
			const specialMessage = 'message-with-special-chars!@#$%^&*()';

			service.testRegisterListener(specialMessage, listener);
			expect(service.testHasListener(specialMessage)).toBe(true);
		});

		it('should handle very long message types', () => {
			const listener = vi.fn();
			const longMessage = 'a'.repeat(1000);

			service.testRegisterListener(longMessage, listener);
			expect(service.testHasListener(longMessage)).toBe(true);
		});
	});
});
