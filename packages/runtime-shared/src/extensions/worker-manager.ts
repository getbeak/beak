import type { Extension, ExtensionVariable, LoadedExtension } from '@beak/common/types/extensions';
import Squawk from '@beak/common/utils/squawk';
import ksuid from '@beak/ksuid';
import type { ValueSections, Context as VariableContext } from '@getbeak/types/values';
import type { Providers } from '../base';
import { ExtensionManifests, type ParsedExtensionManifest } from './manifest';
import { makeFullyQualifiedType, packageNameFromType, variableIdFromType } from './manifest-helpers';
import { ProjectExtensionRegistry } from './registry-base';

/**
 * Per-package worker record held by the registry. The opaque worker handle
 * is supplied by the host's `WorkerProvider`; the manager itself never
 * touches platform primitives.
 */
interface WorkerRecord {
	worker: UnifiedWorker;
	unsubscribe: () => void;
	loaded: LoadedExtension;
	pendingCalls: Map<string, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>;
}

/**
 * Host adapter: spins up a worker that evaluates `WORKER_SOURCE`. The
 * web shell wraps a `Worker` from a Blob URL; the Electron host wraps
 * a `node:worker_threads` Worker with the runtime shim prepended.
 */
export interface WorkerProvider {
	spawn(name: string): UnifiedWorker;
}

/**
 * Minimal Worker shape that both Web Workers and `worker_threads`
 * Workers satisfy after a thin adapter. Listener registrations return
 * an unsubscribe function so the manager doesn't have to keep
 * platform-specific references.
 */
export interface UnifiedWorker {
	postMessage(message: unknown): void;
	onMessage(listener: (message: unknown) => void): () => void;
	onError(listener: (error: unknown) => void): () => void;
	terminate(): void | Promise<unknown>;
}

/**
 * Host callbacks the manager invokes when the worker reaches out for
 * something the worker itself can't do — recursive variable parsing
 * (which roundtrips back to the renderer over IPC) and structured
 * logging (which lands in the host's logger).
 */
export interface WorkerManagerCallbacks<TCallerCtx = unknown> {
	parseValueSections(
		callerCtx: TCallerCtx,
		varCtx: VariableContext,
		parts: ValueSections,
		recursiveDepth: number,
	): Promise<string>;
	log(packageName: string, level: string, message: string): void;
}

export interface WorkerExtensionManagerOptions<TCallerCtx = unknown> {
	providers: Providers;
	workerProvider: WorkerProvider;
	callbacks: WorkerManagerCallbacks<TCallerCtx>;
}

const INIT_TIMEOUT_MS = 5_000;
const CALL_TIMEOUT_MS = 30_000;
const PARSE_VALUE_SECTIONS_TIMEOUT_MS = 30_000;

/**
 * Host-agnostic extension lifecycle + call routing. One worker per
 * loaded extension; same surface every host already implemented before
 * this consolidation. See ADR-0003.
 */
export class WorkerExtensionManager<TCallerCtx = unknown> {
	private readonly registry = new ProjectExtensionRegistry<WorkerRecord>({
		dispose: terminate,
	});
	private readonly providers: Providers;
	private readonly workerProvider: WorkerProvider;
	private readonly callbacks: WorkerManagerCallbacks<TCallerCtx>;
	/**
	 * Track in-flight parseValueSections calls keyed by the caller ctx
	 * the request originated from. Currently used only to scope the
	 * callback to the right host context; the manager itself doesn't
	 * need to demultiplex by it.
	 */
	private callerCtxByWorker = new WeakMap<UnifiedWorker, TCallerCtx>();

	constructor(opts: WorkerExtensionManagerOptions<TCallerCtx>) {
		this.providers = opts.providers;
		this.workerProvider = opts.workerProvider;
		this.callbacks = opts.callbacks;
	}

	async resetProject(projectId: string): Promise<void> {
		await this.registry.resetProject(projectId);
	}

	async load(
		projectId: string,
		extensionPath: string,
		options: { validateScriptPath?: (scriptPath: string) => Promise<void> } = {},
	): Promise<LoadedExtension> {
		const manifests = new ExtensionManifests(this.providers);
		const manifest = await manifests.parse(extensionPath, {
			validateScriptPath: options.validateScriptPath,
		});
		const userSource = await readUserSource(this.providers, manifest);

		const worker = this.workerProvider.spawn(`beak-ext:${manifest.packageName}`);

		const record: WorkerRecord = {
			worker,
			unsubscribe: () => {},
			loaded: {
				status: 'loaded',
				packageName: manifest.packageName,
				version: manifest.version,
				displayName: manifest.displayName,
				description: manifest.description,
				author: manifest.author,
				homepage: manifest.homepage,
				filePath: extensionPath,
				apiVersion: 1,
				variables: [],
			},
			pendingCalls: new Map(),
		};

		const metadata = await initWorker(worker, userSource, manifest.packageName);

		record.loaded.variables = metadata.map(meta => ({
			...meta,
			type: makeFullyQualifiedType(manifest.packageName, meta.variableId),
		}));

		record.unsubscribe = this.attachListener(record);

		await this.registry.insert(projectId, manifest.packageName, record);

		return record.loaded;
	}

	async unload(projectId: string, packageName: string): Promise<void> {
		await this.registry.unload(projectId, packageName);
	}

	list(projectId: string): Extension[] {
		return this.registry.list(projectId);
	}

	/* ---- Variable invocation ------------------------------------------ */

	async variableCreateDefaultPayload(
		projectId: string,
		type: string,
		varCtx: VariableContext,
		callerCtx: TCallerCtx,
	): Promise<Record<string, unknown>> {
		const { record, variableId } = this.resolve(projectId, type);
		this.callerCtxByWorker.set(record.worker, callerCtx);
		return (await this.call(record, [variableId, 'createDefaultPayload'], [varCtx])) as Record<string, unknown>;
	}

	async variableGetValue(
		projectId: string,
		type: string,
		varCtx: VariableContext,
		callerCtx: TCallerCtx,
		payload: unknown,
		recursiveDepth: number,
	): Promise<string> {
		const { record, variableId } = this.resolve(projectId, type);
		this.callerCtxByWorker.set(record.worker, callerCtx);
		return (await this.call(record, [variableId, 'getValue'], [varCtx, payload, recursiveDepth])) as string;
	}

	async variableGetAssetRef(
		projectId: string,
		type: string,
		varCtx: VariableContext,
		callerCtx: TCallerCtx,
		payload: unknown,
		recursiveDepth: number,
	): Promise<{ sha256: string; size: number; contentType?: string } | null> {
		const { record, variableId, meta } = this.resolve(projectId, type);
		if (!meta.binary) return null;
		this.callerCtxByWorker.set(record.worker, callerCtx);
		return (await this.call(record, [variableId, 'getAssetRef'], [varCtx, payload, recursiveDepth])) as {
			sha256: string;
			size: number;
			contentType?: string;
		} | null;
	}

	async variableEditorCreateUI(
		projectId: string,
		type: string,
		varCtx: VariableContext,
		callerCtx: TCallerCtx,
	): Promise<unknown> {
		const { record, variableId } = this.resolve(projectId, type);
		this.callerCtxByWorker.set(record.worker, callerCtx);
		return await this.call(record, [variableId, 'editor', 'createUserInterface'], [varCtx]);
	}

	async variableEditorLoad(
		projectId: string,
		type: string,
		varCtx: VariableContext,
		callerCtx: TCallerCtx,
		payload: unknown,
	): Promise<unknown> {
		const { record, variableId } = this.resolve(projectId, type);
		this.callerCtxByWorker.set(record.worker, callerCtx);
		return await this.call(record, [variableId, 'editor', 'load'], [varCtx, payload]);
	}

	async variableEditorSave(
		projectId: string,
		type: string,
		varCtx: VariableContext,
		callerCtx: TCallerCtx,
		existingPayload: unknown,
		state: unknown,
	): Promise<unknown> {
		const { record, variableId } = this.resolve(projectId, type);
		this.callerCtxByWorker.set(record.worker, callerCtx);
		return await this.call(record, [variableId, 'editor', 'save'], [varCtx, existingPayload, state]);
	}

	/* ---- Internals ----------------------------------------------------- */

	private resolve(
		projectId: string,
		type: string,
	): { record: WorkerRecord; variableId: string; meta: ExtensionVariable } {
		const packageName = packageNameFromType(type);
		const variableId = variableIdFromType(type);
		const record = this.registry.byPackage(projectId, packageName);
		const meta = record?.loaded.variables.find(v => v.variableId === variableId);

		if (!record || !meta) throw new Squawk('unknown_registered_extension', { projectId, type });

		return { record, variableId, meta };
	}

	private attachListener(record: WorkerRecord): () => void {
		const unsubMessage = record.worker.onMessage(async raw => {
			const message = raw as { kind: string; [k: string]: unknown };

			if (message.kind === 'init-ok' || message.kind === 'init-error') return;

			if (message.kind === 'result' || message.kind === 'error') {
				const callId = message.callId as string;
				const pending = record.pendingCalls.get(callId);
				if (!pending) return;
				record.pendingCalls.delete(callId);
				if (message.kind === 'result') pending.resolve((message as unknown as { value: unknown }).value);
				else pending.reject(deserialiseWorkerError(message.error as WorkerErrorEnvelope));
				return;
			}

			if (message.kind === 'parse-value-sections') {
				const requestId = message.requestId as string;
				const ctx = message.ctx as VariableContext;
				const parts = message.parts as ValueSections;

				try {
					const callerCtx = this.callerCtxByWorker.get(record.worker) as TCallerCtx;
					const parsed = await withTimeout(
						this.callbacks.parseValueSections(callerCtx, ctx, parts, 0),
						PARSE_VALUE_SECTIONS_TIMEOUT_MS,
						'parse_value_sections_timeout',
					);
					record.worker.postMessage({ kind: 'parse-value-sections-result', requestId, parsed });
				} catch (error) {
					const code =
						error instanceof Squawk
							? error.code
							: ((error as { code?: string } | undefined)?.code ?? 'parse_value_sections_failed');
					const messageText =
						error instanceof Error ? error.message : ((error as { message?: string })?.message ?? 'unknown error');
					record.worker.postMessage({
						kind: 'parse-value-sections-error',
						requestId,
						error: { code, message: messageText },
					});
				}
				return;
			}

			if (message.kind === 'log') {
				const level = (message.level as string) || 'info';
				const packageName = (message.packageName as string) || 'unknown';
				const text = (message.message as string) || '';
				this.callbacks.log(packageName, level, text);
			}
		});

		const unsubError = record.worker.onError(error => {
			// Surface to logger; in-flight calls still time out individually.
			const messageText = error instanceof Error ? error.message : String(error);
			this.callbacks.log(record.loaded.packageName, 'error', `worker error: ${messageText}`);
		});

		return () => {
			unsubMessage();
			unsubError();
		};
	}

	private async call(record: WorkerRecord, path: string[], args: unknown[]): Promise<unknown> {
		const callId = ksuid.generate('extcall').toString();

		return await new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				record.pendingCalls.delete(callId);
				reject(new Squawk('extension_call_timeout', { path, timeoutMs: CALL_TIMEOUT_MS }));
			}, CALL_TIMEOUT_MS);

			record.pendingCalls.set(callId, {
				resolve: value => {
					clearTimeout(timer);
					resolve(value);
				},
				reject: error => {
					clearTimeout(timer);
					reject(error);
				},
			});

			record.worker.postMessage({ kind: 'call', callId, path, args });
		});
	}
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

interface WorkerErrorEnvelope {
	code?: string;
	message?: string;
	info?: unknown;
}

function deserialiseWorkerError(error?: WorkerErrorEnvelope): Squawk {
	return new Squawk(error?.code ?? 'extension_runtime_error', {
		message: error?.message ?? 'unknown error',
		info: error?.info,
	});
}

function terminate(record: WorkerRecord): void {
	try {
		record.unsubscribe();
	} catch {
		/* listener already detached */
	}
	try {
		void record.worker.terminate();
	} catch {
		/* already terminated */
	}

	for (const pending of record.pendingCalls.values()) {
		pending.reject(new Squawk('extension_terminated', {}));
	}
	record.pendingCalls.clear();
}

async function readUserSource(providers: Providers, manifest: ParsedExtensionManifest): Promise<string> {
	const raw = await providers.node.fs.promises.readFile(manifest.scriptPath, 'utf8');
	return typeof raw === 'string' ? raw : new TextDecoder().decode(raw as Uint8Array);
}

function initWorker(worker: UnifiedWorker, userSource: string, packageName: string): Promise<ExtensionVariable[]> {
	return new Promise<ExtensionVariable[]>((resolve, reject) => {
		const timer = setTimeout(() => {
			cleanup();
			void worker.terminate();
			reject(new Squawk('extension_init_timeout', { packageName, timeoutMs: INIT_TIMEOUT_MS }));
		}, INIT_TIMEOUT_MS);

		const unsubscribe = worker.onMessage(raw => {
			const data = raw as { kind: string };
			if (data.kind === 'init-ok') {
				cleanup();
				resolve((data as unknown as { metadata: ExtensionVariable[] }).metadata);
				return;
			}
			if (data.kind === 'init-error') {
				cleanup();
				const err = (data as unknown as { error: { code: string; message: string; info?: unknown } }).error;
				void worker.terminate();
				reject(
					new Squawk(err.code, {
						...((err.info as Record<string, unknown>) ?? {}),
						message: err.message,
						packageName,
					}),
				);
			}
		});

		function cleanup() {
			clearTimeout(timer);
			unsubscribe();
		}

		worker.postMessage({ kind: 'init', userSource, packageName });
	});
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, code: string): Promise<T> {
	return await new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => reject(new Squawk(code, { timeoutMs })), timeoutMs);
		promise.then(
			value => {
				clearTimeout(timer);
				resolve(value);
			},
			error => {
				clearTimeout(timer);
				reject(error);
			},
		);
	});
}
