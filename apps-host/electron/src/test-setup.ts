import { vi } from 'vitest';

// Mock electron modules for tests
vi.mock('electron', () => ({
	ipcMain: {
		handle: vi.fn(),
	},
	ipcRenderer: {
		on: vi.fn(),
		invoke: vi.fn(),
	},
	WebContents: vi.fn(),
}));

// Mock other Node.js modules as needed
vi.mock('fs-extra', () => ({
	default: {
		readJson: vi.fn(),
		writeJson: vi.fn(),
		readFile: vi.fn(),
		writeFile: vi.fn(),
		ensureDir: vi.fn(),
		remove: vi.fn(),
		pathExists: vi.fn(),
	},
}));
