import { vi } from 'vitest';

// Mock global objects that might not be available in jsdom
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Mock matchMedia
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

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Mock crypto.randomUUID if not available
if (!global.crypto?.randomUUID) {
	global.crypto = {
		...global.crypto,
		randomUUID: (() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)) as Crypto['randomUUID'],
	};
}

// Stub the Electron preload bridge so modules that touch ipc at import time don't blow up.
(window as unknown as { secureBridge: { ipc: { on: () => void; invoke: () => Promise<unknown> } } }).secureBridge = {
	ipc: {
		on: () => {},
		invoke: () => Promise.resolve(),
	},
};
