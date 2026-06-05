import { vi } from 'vitest';

// Mock window.secureBridge for tests
Object.defineProperty(window, 'secureBridge', {
	value: {
		ipc: {
			on: vi.fn(),
			invoke: vi.fn(),
		},
	},
	writable: true,
});

// Mock other browser APIs as needed
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation(query => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});
