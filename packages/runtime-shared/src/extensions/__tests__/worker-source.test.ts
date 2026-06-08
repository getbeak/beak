import { Worker } from 'node:worker_threads';

import { afterAll, describe, expect, it } from 'vitest';

import { WORKER_RUNTIME_NODE_SHIM, WORKER_SOURCE } from '../worker-source';

/**
 * End-to-end exercises of `WORKER_SOURCE` running under `node:worker_threads`
 * — the production Electron path. Each test spins up a fresh worker, drives
 * the wire protocol (`init` / `call`), and asserts the worker's behaviour.
 *
 * The sandbox tests double as the regression net for ADR-0003 §3: every
 * vector that escaped during the drive-security audit lives here.
 */

const FULL_SOURCE = `${WORKER_RUNTIME_NODE_SHIM}\n${WORKER_SOURCE}`;

interface WorkerSession {
	worker: Worker;
	dispose: () => Promise<void>;
}

const sessions: WorkerSession[] = [];

function spawnWorker(): WorkerSession {
	const worker = new Worker(FULL_SOURCE, { eval: true, name: 'wsrc-test' });
	const session: WorkerSession = {
		worker,
		dispose: async () => {
			worker.removeAllListeners();
			await worker.terminate();
		},
	};
	sessions.push(session);
	return session;
}

afterAll(async () => {
	await Promise.all(sessions.map(s => s.dispose()));
});

async function initAndCall(userSource: string): Promise<{ initOk: boolean; metadata?: unknown; error?: unknown; result?: unknown }> {
	const { worker } = spawnWorker();
	return await new Promise(resolve => {
		const collected: { initOk: boolean; metadata?: unknown; error?: unknown; result?: unknown } = { initOk: false };
		worker.on('message', message => {
			if (message.kind === 'init-ok') {
				collected.initOk = true;
				collected.metadata = message.metadata;
				worker.postMessage({ kind: 'call', callId: 'c1', path: ['probe', 'getValue'], args: [{}, {}, 0] });
				return;
			}
			if (message.kind === 'init-error') {
				collected.initOk = false;
				collected.error = message.error;
				resolve(collected);
				return;
			}
			if (message.kind === 'result') {
				collected.result = message.value;
				resolve(collected);
				return;
			}
			if (message.kind === 'error') {
				collected.error = message.error;
				resolve(collected);
			}
		});
		worker.on('error', err => {
			collected.error = { code: 'worker_error', message: err instanceof Error ? err.message : String(err) };
			resolve(collected);
		});
		worker.postMessage({ kind: 'init', userSource, packageName: 'test-pkg' });
	});
}

const probeExtension = `
module.exports = {
	apiVersion: 1,
	variables: [{
		id: 'probe',
		name: 'Probe',
		description: 'Reach for things the sandbox should block.',
		createDefaultPayload: () => ({}),
		getValue: () => {
			const r = {};
			const t = (label, fn) => { try { r[label] = fn(); } catch (e) { r[label] = 'T:' + (e.message || String(e)); } };
			t('process', () => typeof process);
			t('require', () => typeof require);
			t('Buffer', () => typeof Buffer);
			t('console', () => typeof console);
			t('Atomics', () => typeof Atomics);
			t('SharedArrayBuffer', () => typeof SharedArrayBuffer);
			t('WebAssembly', () => typeof WebAssembly);
			t('eval', () => typeof eval);
			t('setTimeout', () => typeof setTimeout);
			t('fetch', () => typeof fetch);
			t('via_module_ctor', () => typeof module.constructor.constructor('return process')());
			t('via_exports_ctor', () => typeof exports.constructor.constructor('return process')());
			t('via_Function', () => typeof Function('return process')());
			t('via_obj_ctor', () => typeof ({}).constructor.constructor('return process')());
			t('via_promise_ctor', () => typeof Promise.resolve(0).constructor.constructor('return process')());
			t('via_globalThis', () => typeof globalThis.process);
			t('via_wasm', () => { new WebAssembly.Module(new Uint8Array([0,97,115,109,1,0,0,0])); return 'ALLOWED'; });
			return JSON.stringify(r);
		}
	}]
};
`;

describe('WORKER_SOURCE — sandbox properties', () => {
	it('strips Node + Web platform globals reachable by name', async () => {
		const outcome = await initAndCall(probeExtension);
		expect(outcome.initOk).toBe(true);
		const r = JSON.parse(outcome.result as string) as Record<string, string>;
		expect(r.process).toBe('undefined');
		expect(r.require).toBe('undefined');
		expect(r.Buffer).toBe('undefined');
		expect(r.console).toBe('undefined');
		expect(r.Atomics).toBe('undefined');
		expect(r.SharedArrayBuffer).toBe('undefined');
		expect(r.WebAssembly).toBe('undefined');
		expect(r.eval).toBe('undefined');
		expect(r.setTimeout).toBe('undefined');
		expect(r.fetch).toBe('undefined');
		expect(r.via_globalThis).toBe('undefined');
	});

	it('blocks Function-constructor escape via outer-realm primordials', async () => {
		const outcome = await initAndCall(probeExtension);
		expect(outcome.initOk).toBe(true);
		const r = JSON.parse(outcome.result as string) as Record<string, string>;
		// Every "walk to outer Function and call it" path must throw under
		// `codeGeneration: { strings: false }`. Bug here = ADR-0003 §3
		// regression.
		expect(r.via_module_ctor).toMatch(/Code generation from strings disallowed/);
		expect(r.via_exports_ctor).toMatch(/Code generation from strings disallowed/);
		expect(r.via_Function).toMatch(/Code generation from strings disallowed/);
		expect(r.via_obj_ctor).toMatch(/Code generation from strings disallowed/);
		expect(r.via_promise_ctor).toMatch(/Code generation from strings disallowed/);
	});

	it('blocks WebAssembly.compile / Module construction', async () => {
		const outcome = await initAndCall(probeExtension);
		expect(outcome.initOk).toBe(true);
		const r = JSON.parse(outcome.result as string) as Record<string, string>;
		// WebAssembly itself is deleted from the sandbox globals; the
		// `codeGeneration.wasm: false` flag would block compile too.
		expect(r.via_wasm).toBe('T:WebAssembly is not defined');
	});
});

describe('WORKER_SOURCE — validation', () => {
	it('rejects an extension that does not export defineExtension', async () => {
		const outcome = await initAndCall('module.exports = 42;');
		expect(outcome.initOk).toBe(false);
		expect((outcome.error as { code: string }).code).toBe('extension_invalid_export');
	});

	it('rejects an unsupported apiVersion', async () => {
		const outcome = await initAndCall(
			'module.exports = { apiVersion: 999, variables: [{ id: "x", name: "X", description: "x", createDefaultPayload: () => ({}), getValue: () => "x" }] };',
		);
		expect(outcome.initOk).toBe(false);
		expect((outcome.error as { code: string }).code).toBe('extension_unsupported_api_version');
	});

	it('rejects when the extension contributes no variables', async () => {
		const outcome = await initAndCall('module.exports = { apiVersion: 1, variables: [] };');
		expect(outcome.initOk).toBe(false);
		expect((outcome.error as { code: string }).code).toBe('extension_no_variables');
	});

	it('rejects a variable missing its id', async () => {
		const outcome = await initAndCall(
			'module.exports = { apiVersion: 1, variables: [{ name: "x", description: "d", createDefaultPayload: () => ({}), getValue: () => "x" }] };',
		);
		expect(outcome.initOk).toBe(false);
		expect((outcome.error as { code: string }).code).toBe('extension_variable_missing_id');
	});

	it('rejects an editor block without createUserInterface', async () => {
		const outcome = await initAndCall(
			'module.exports = { apiVersion: 1, variables: [{ id: "x", name: "X", description: "d", createDefaultPayload: () => ({}), getValue: () => "x", editor: { load: () => ({}) } }] };',
		);
		expect(outcome.initOk).toBe(false);
		expect((outcome.error as { code: string }).code).toBe('extension_editor_incomplete');
	});

	it('init-ok returns the variable metadata shape the host expects', async () => {
		const outcome = await initAndCall(
			`module.exports = {
				apiVersion: 1,
				variables: [{
					id: 'pingvar',
					name: 'Ping',
					description: 'returns pong',
					sensitive: true,
					keywords: ['p', 'q'],
					createDefaultPayload: () => ({}),
					getValue: () => 'pong',
					getAssetRef: () => null,
				}],
			};`,
		);
		expect(outcome.initOk).toBe(true);
		const metadata = outcome.metadata as Array<Record<string, unknown>>;
		expect(metadata).toHaveLength(1);
		expect(metadata[0]).toMatchObject({
			variableId: 'pingvar',
			name: 'Ping',
			description: 'returns pong',
			sensitive: true,
			keywords: ['p', 'q'],
			editable: false,
			binary: true, // getAssetRef present
		});
	});
});

describe('WORKER_SOURCE — happy path', () => {
	it('routes a getValue call through the worker and returns the value', async () => {
		const outcome = await initAndCall(
			"module.exports = { apiVersion: 1, variables: [{ id: 'probe', name: 'P', description: 'd', createDefaultPayload: () => ({}), getValue: () => 'pong' }] };",
		);
		expect(outcome.initOk).toBe(true);
		expect(outcome.result).toBe('pong');
	});

	it('propagates errors thrown inside getValue back to the host', async () => {
		const outcome = await initAndCall(
			"module.exports = { apiVersion: 1, variables: [{ id: 'probe', name: 'P', description: 'd', createDefaultPayload: () => ({}), getValue: () => { throw new Error('boom'); } }] };",
		);
		expect(outcome.initOk).toBe(true);
		expect((outcome.error as { message: string }).message).toMatch(/boom/);
	});
});
