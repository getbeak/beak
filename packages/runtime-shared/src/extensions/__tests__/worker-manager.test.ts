import { promises as fs } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import nodePath, { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Providers } from '../../base';
import type { UnifiedWorker, WorkerManagerCallbacks, WorkerProvider } from '../worker-manager';
import { WorkerExtensionManager } from '../worker-manager';

/**
 * Unit tests for `WorkerExtensionManager`. The worker is stubbed via a fake
 * `WorkerProvider`/`UnifiedWorker`, so these exercise the manager's wire
 * handling (init / call / error / log) without spawning a real V8 isolate.
 *
 * Sandbox + worker-source behaviour is covered by `worker-source.test.ts`.
 */

function buildProviders(): Providers {
	return {
		// biome-ignore lint/suspicious/noExplicitAny: stubs sufficient for the surface manager.load() touches
		aes: { algorithmVersionMap: {}, generateKey: async () => 'k' } as any,
		// biome-ignore lint/suspicious/noExplicitAny: stub
		credentials: { setProjectEncryption: async () => undefined } as any,
		// biome-ignore lint/suspicious/noExplicitAny: stub
		logger: { info: () => {}, error: () => {}, warn: () => {} } as any,
		// biome-ignore lint/suspicious/noExplicitAny: stub
		storage: { get: async () => undefined, set: async () => {}, has: async () => false } as any,
		node: {
			// biome-ignore lint/suspicious/noExplicitAny: real fs satisfies the narrow surface
			fs: { promises: fs } as any,
			// biome-ignore lint/suspicious/noExplicitAny: see above
			path: nodePath as any,
		},
	} as Providers;
}

class StubWorker implements UnifiedWorker {
	private messageListeners: Array<(message: unknown) => void> = [];
	private errorListeners: Array<(error: unknown) => void> = [];
	terminated = false;
	postMessageLog: unknown[] = [];

	postMessage(message: unknown): void {
		this.postMessageLog.push(message);
	}

	onMessage(listener: (message: unknown) => void): () => void {
		this.messageListeners.push(listener);
		return () => {
			this.messageListeners = this.messageListeners.filter(l => l !== listener);
		};
	}

	onError(listener: (error: unknown) => void): () => void {
		this.errorListeners.push(listener);
		return () => {
			this.errorListeners = this.errorListeners.filter(l => l !== listener);
		};
	}

	async terminate(): Promise<void> {
		this.terminated = true;
	}

	/** Drive a message from the worker to the host. */
	emit(message: unknown): void {
		for (const listener of this.messageListeners) listener(message);
	}

	/** Drive an uncaught error from the worker. */
	emitError(error: unknown): void {
		for (const listener of this.errorListeners) listener(error);
	}
}

class StubProvider implements WorkerProvider {
	readonly workers: StubWorker[] = [];

	spawn(_name: string): UnifiedWorker {
		const worker = new StubWorker();
		this.workers.push(worker);
		return worker;
	}
}

async function writeFakeExtension(root: string, packageName: string, source = "module.exports = { apiVersion: 1, variables: [] };"): Promise<string> {
	const folder = join(root, packageName);
	await fs.mkdir(folder, { recursive: true });
	await fs.writeFile(
		join(folder, 'package.json'),
		JSON.stringify({ name: packageName, version: '1.0.0', main: 'index.js', beak: { apiVersion: 1 } }),
	);
	await fs.writeFile(join(folder, 'index.js'), source);
	return folder;
}

function makeCallbacks(): WorkerManagerCallbacks<null> {
	return {
		parseValueSections: vi.fn(async () => 'parsed'),
		log: vi.fn(),
	};
}

/**
 * `manager.load()` does an async manifest parse + script read before it
 * spawns the worker. Tests need to drain the microtask queue a few times
 * before the stub worker is visible.
 */
async function waitForWorker(provider: StubProvider, index = 0): Promise<StubWorker> {
	for (let i = 0; i < 50; i++) {
		const worker = provider.workers[index];
		if (worker) return worker;
		await new Promise(resolve => setImmediate(resolve));
	}
	throw new Error(`worker[${index}] never spawned`);
}

const FAKE_METADATA = [
	{
		variableId: 'v',
		name: 'V',
		description: 'd',
		sensitive: false,
		keywords: [],
		attributes: { requiresRequestId: false },
		editable: false,
		binary: false,
	},
];

async function loadDemo(provider: StubProvider, manager: WorkerExtensionManager<null>, folder: string): Promise<StubWorker> {
	const pending = manager.load('p1', folder);
	const worker = await waitForWorker(provider);
	worker.emit({ kind: 'init-ok', metadata: FAKE_METADATA });
	await pending;
	return worker;
}

let workdir: string;

beforeEach(async () => {
	workdir = await mkdtemp(join(tmpdir(), 'wem-'));
});

afterEach(async () => {
	await rm(workdir, { recursive: true, force: true });
});

describe('WorkerExtensionManager.load', () => {
	it('spawns a worker, posts the init message, and resolves with the loaded surface', async () => {
		const folder = await writeFakeExtension(workdir, 'demo');
		const provider = new StubProvider();
		const manager = new WorkerExtensionManager<null>({
			providers: buildProviders(),
			workerProvider: provider,
			callbacks: makeCallbacks(),
		});

		const pending = manager.load('p1', folder);
		const worker = await waitForWorker(provider);
		expect(worker.postMessageLog).toEqual([expect.objectContaining({ kind: 'init', packageName: 'demo' })]);

		worker.emit({ kind: 'init-ok', metadata: FAKE_METADATA });
		const loaded = await pending;

		expect(loaded.packageName).toBe('demo');
		expect(loaded.variables).toHaveLength(1);
		expect(loaded.variables[0].type).toBe('external:demo/v');
	});

	it('rejects with the worker-reported error code when init-error arrives', async () => {
		const folder = await writeFakeExtension(workdir, 'broken');
		const provider = new StubProvider();
		const manager = new WorkerExtensionManager<null>({
			providers: buildProviders(),
			workerProvider: provider,
			callbacks: makeCallbacks(),
		});

		const pending = manager.load('p1', folder);
		const worker = await waitForWorker(provider);
		worker.emit({ kind: 'init-error', error: { code: 'extension_no_variables', message: 'none' } });

		await expect(pending).rejects.toMatchObject({ code: 'extension_no_variables' });
	});
});

describe('WorkerExtensionManager.variable*', () => {
	it('routes getValue → posts call to worker → resolves with the worker result', async () => {
		const folder = await writeFakeExtension(workdir, 'demo');
		const provider = new StubProvider();
		const manager = new WorkerExtensionManager<null>({
			providers: buildProviders(),
			workerProvider: provider,
			callbacks: makeCallbacks(),
		});

		const worker = await loadDemo(provider, manager, folder);
		const callPending = manager.variableGetValue('p1', 'external:demo/v', {} as never, null, { p: 1 }, 0);
		const callMessage = worker.postMessageLog[worker.postMessageLog.length - 1] as { kind: string; callId: string; path: string[]; args: unknown[] };
		expect(callMessage.kind).toBe('call');
		expect(callMessage.path).toEqual(['v', 'getValue']);
		expect(callMessage.args).toEqual([{}, { p: 1 }, 0]);

		worker.emit({ kind: 'result', callId: callMessage.callId, value: 'forty-two' });
		await expect(callPending).resolves.toBe('forty-two');
	});

	it('rejects on a worker error message with the Squawk shape', async () => {
		const folder = await writeFakeExtension(workdir, 'demo');
		const provider = new StubProvider();
		const manager = new WorkerExtensionManager<null>({
			providers: buildProviders(),
			workerProvider: provider,
			callbacks: makeCallbacks(),
		});

		const worker = await loadDemo(provider, manager, folder);
		const callPending = manager.variableGetValue('p1', 'external:demo/v', {} as never, null, {}, 0);
		const callId = (worker.postMessageLog[worker.postMessageLog.length - 1] as { callId: string }).callId;
		worker.emit({ kind: 'error', callId, error: { code: 'extension_custom_error', message: 'nope' } });

		await expect(callPending).rejects.toMatchObject({ code: 'extension_custom_error' });
	});

	it('throws unknown_registered_extension for an unloaded type', async () => {
		const manager = new WorkerExtensionManager<null>({
			providers: buildProviders(),
			workerProvider: new StubProvider(),
			callbacks: makeCallbacks(),
		});

		await expect(
			manager.variableGetValue('nobody', 'external:ghost/x', {} as never, null, {}, 0),
		).rejects.toMatchObject({ code: 'unknown_registered_extension' });
	});

	it('returns null for getAssetRef on a non-binary variable without posting to the worker', async () => {
		const folder = await writeFakeExtension(workdir, 'demo');
		const provider = new StubProvider();
		const manager = new WorkerExtensionManager<null>({
			providers: buildProviders(),
			workerProvider: provider,
			callbacks: makeCallbacks(),
		});

		const worker = await loadDemo(provider, manager, folder);
		const before = worker.postMessageLog.length;
		const result = await manager.variableGetAssetRef('p1', 'external:demo/v', {} as never, null, {}, 0);
		expect(result).toBeNull();
		expect(worker.postMessageLog.length).toBe(before);
	});
});

describe('WorkerExtensionManager — lifecycle', () => {
	it('unload terminates the worker and rejects any in-flight calls', async () => {
		const folder = await writeFakeExtension(workdir, 'demo');
		const provider = new StubProvider();
		const manager = new WorkerExtensionManager<null>({
			providers: buildProviders(),
			workerProvider: provider,
			callbacks: makeCallbacks(),
		});

		const worker = await loadDemo(provider, manager, folder);
		const callPending = manager.variableGetValue('p1', 'external:demo/v', {} as never, null, {}, 0);
		await manager.unload('p1', 'demo');

		expect(worker.terminated).toBe(true);
		await expect(callPending).rejects.toMatchObject({ code: 'extension_terminated' });
	});

	it('worker onError rejects pending calls without waiting for the call timeout', async () => {
		const folder = await writeFakeExtension(workdir, 'demo');
		const provider = new StubProvider();
		const manager = new WorkerExtensionManager<null>({
			providers: buildProviders(),
			workerProvider: provider,
			callbacks: makeCallbacks(),
		});

		const worker = await loadDemo(provider, manager, folder);
		const callPending = manager.variableGetValue('p1', 'external:demo/v', {} as never, null, {}, 0);
		worker.emitError(new Error('runtime exploded'));

		await expect(callPending).rejects.toMatchObject({ code: 'extension_worker_error' });
	});

	it('forwards log messages from the worker through the host callback', async () => {
		const folder = await writeFakeExtension(workdir, 'demo');
		const provider = new StubProvider();
		const callbacks = makeCallbacks();
		const manager = new WorkerExtensionManager<null>({
			providers: buildProviders(),
			workerProvider: provider,
			callbacks,
		});

		const worker = await loadDemo(provider, manager, folder);
		worker.emit({ kind: 'log', packageName: 'demo', level: 'info', message: 'hello' });
		expect(callbacks.log).toHaveBeenCalledWith('demo', 'info', 'hello');
	});

	it('parseValueSections from the worker round-trips back via the host callback', async () => {
		const folder = await writeFakeExtension(workdir, 'demo');
		const provider = new StubProvider();
		const callbacks = makeCallbacks();
		(callbacks.parseValueSections as ReturnType<typeof vi.fn>).mockResolvedValue('parsed-result');
		const manager = new WorkerExtensionManager<null>({
			providers: buildProviders(),
			workerProvider: provider,
			callbacks,
		});

		const worker = await loadDemo(provider, manager, folder);
		// Pretend we're mid-call so callerCtxByWorker is set.
		void manager.variableGetValue('p1', 'external:demo/v', {} as never, null, {}, 0);
		worker.emit({ kind: 'parse-value-sections', requestId: 'r1', ctx: {}, parts: ['lit'] });
		// Drain microtasks so the async callback can fire + the manager can post back.
		await new Promise(resolve => setImmediate(resolve));
		expect(callbacks.parseValueSections).toHaveBeenCalled();

		const lastPosted = worker.postMessageLog[worker.postMessageLog.length - 1] as { kind: string; requestId: string; parsed: string };
		expect(lastPosted).toEqual({ kind: 'parse-value-sections-result', requestId: 'r1', parsed: 'parsed-result' });
	});
});
