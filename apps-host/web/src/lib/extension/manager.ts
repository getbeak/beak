import {
	ExtensionsMessages,
	type IpcExtensionsServiceMain,
	type VariableParseValueSectionsResponse,
} from '@beak/common/ipc/extensions';
import type { IpcMessage } from '@beak/common/ipc/types';
import type { Extension, ExtensionVariable, LoadedExtension } from '@beak/common/types/extensions';
import Squawk from '@beak/common/utils/squawk';
import ksuid from '@beak/ksuid';
import {
	ExtensionManifests,
	makeFullyQualifiedType,
	ProjectExtensionRegistry,
	packageNameFromType,
	variableIdFromType,
} from '@beak/runtime-shared/extensions';
import type { ValueSections, Context as VariableContext } from '@getbeak/types/values';

import getRuntime from '../../host';
import { webIpcMain } from '../../ipc/ipc';
import { WORKER_SOURCE } from './worker-source';

interface WorkerRecord {
	worker: Worker;
	loaded: LoadedExtension;
	pendingCalls: Map<string, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>;
}

const INIT_TIMEOUT_MS = 5_000;
const CALL_TIMEOUT_MS = 30_000;

/**
 * Manages one Web Worker per loaded extension. Mirrors the electron
 * `ExtensionManager` surface — same method names, same return shapes —
 * so the IPC handlers can call into either side without branching.
 */
export default class WebExtensionManager {
	private readonly registry = new ProjectExtensionRegistry<WorkerRecord>({ dispose: terminate });
	private readonly service: IpcExtensionsServiceMain;
	private workerObjectUrl: string | null = null;

	constructor(service: IpcExtensionsServiceMain) {
		this.service = service;
	}

	async resetProject(projectId: string): Promise<void> {
		await this.registry.resetProject(projectId);
	}

	async load(projectId: string, extensionPath: string): Promise<LoadedExtension> {
		const manifests = new ExtensionManifests(getRuntime().providers);
		const manifest = await manifests.parse(extensionPath);
		const fs = getRuntime().p.node.fs.promises;
		const sourceRaw = await fs.readFile(manifest.scriptPath, 'utf8');
		const userSource = typeof sourceRaw === 'string' ? sourceRaw : new TextDecoder().decode(sourceRaw as Uint8Array);

		const worker = new Worker(this.getWorkerObjectUrl(), { name: `beak-ext:${manifest.packageName}` });

		const record: WorkerRecord = {
			worker,
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

		const metadata = await this.initWorker(worker, userSource, manifest.packageName);

		record.loaded.variables = metadata.map(meta => ({
			...meta,
			type: makeFullyQualifiedType(manifest.packageName, meta.variableId),
		}));

		this.attachWorkerListener(record);

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
	): Promise<Record<string, unknown>> {
		const { record, variableId } = this.resolve(projectId, type);
		return (await this.call(record, [variableId, 'createDefaultPayload'], [varCtx])) as Record<string, unknown>;
	}

	async variableGetValue(
		projectId: string,
		type: string,
		varCtx: VariableContext,
		payload: unknown,
		recursiveDepth: number,
	): Promise<string> {
		const { record, variableId } = this.resolve(projectId, type);
		return (await this.call(record, [variableId, 'getValue'], [varCtx, payload, recursiveDepth])) as string;
	}

	async variableGetAssetRef(
		projectId: string,
		type: string,
		varCtx: VariableContext,
		payload: unknown,
		recursiveDepth: number,
	): Promise<{ sha256: string; size: number; contentType?: string } | null> {
		const { record, variableId, meta } = this.resolve(projectId, type);
		if (!meta.binary) return null;
		return (await this.call(record, [variableId, 'getAssetRef'], [varCtx, payload, recursiveDepth])) as {
			sha256: string;
			size: number;
			contentType?: string;
		} | null;
	}

	async variableEditorCreateUI(projectId: string, type: string, varCtx: VariableContext) {
		const { record, variableId } = this.resolve(projectId, type);
		return await this.call(record, [variableId, 'editor', 'createUserInterface'], [varCtx]);
	}

	async variableEditorLoad(projectId: string, type: string, varCtx: VariableContext, payload: unknown) {
		const { record, variableId } = this.resolve(projectId, type);
		return await this.call(record, [variableId, 'editor', 'load'], [varCtx, payload]);
	}

	async variableEditorSave(
		projectId: string,
		type: string,
		varCtx: VariableContext,
		existingPayload: unknown,
		state: unknown,
	) {
		const { record, variableId } = this.resolve(projectId, type);
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

	private getWorkerObjectUrl(): string {
		if (!this.workerObjectUrl) {
			const blob = new Blob([WORKER_SOURCE], { type: 'application/javascript' });
			this.workerObjectUrl = URL.createObjectURL(blob);
		}

		return this.workerObjectUrl;
	}

	private async initWorker(worker: Worker, userSource: string, packageName: string): Promise<ExtensionVariable[]> {
		return await new Promise<ExtensionVariable[]>((resolve, reject) => {
			const timer = setTimeout(() => {
				worker.terminate();
				reject(new Squawk('extension_init_timeout', { packageName, timeoutMs: INIT_TIMEOUT_MS }));
			}, INIT_TIMEOUT_MS);

			const onInit = (event: MessageEvent) => {
				const data = event.data as { kind: string };
				if (data.kind === 'init-ok') {
					clearTimeout(timer);
					worker.removeEventListener('message', onInit);
					resolve((data as unknown as { metadata: ExtensionVariable[] }).metadata);
					return;
				}
				if (data.kind === 'init-error') {
					clearTimeout(timer);
					worker.removeEventListener('message', onInit);
					const err = (data as unknown as { error: { code: string; message: string; info?: unknown } }).error;
					worker.terminate();
					reject(
						new Squawk(err.code, { ...((err.info as Record<string, unknown>) ?? {}), message: err.message, packageName }),
					);
				}
			};

			worker.addEventListener('message', onInit);
			worker.postMessage({ kind: 'init', userSource, packageName });
		});
	}

	private attachWorkerListener(record: WorkerRecord) {
		const service = this.service;

		record.worker.addEventListener('message', async event => {
			const message = event.data as { kind: string; [k: string]: unknown };

			// `init-*` messages are owned by `initWorker` — anything that
			// arrives here (e.g. from a misbehaving worker that emits late)
			// is dropped on the floor; the manager is already past init.
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

				// Forward the recursion request to the renderer (same JS process on
				// the web, but the IPC layer is still where the parser lives).
				const uniqueSessionId = ksuid.generate('rtvparsersp').toString();

				const listener = (_event: unknown, raw: unknown) => {
					const incoming = raw as IpcMessage<VariableParseValueSectionsResponse>;
					if (incoming.code !== ExtensionsMessages.VariableParseValueSectionsResponse) return;
					if (incoming.payload.uniqueSessionId !== uniqueSessionId) return;

					clearTimeout(responseTimeout);
					webIpcMain.off('extensions', listener);
					record.worker.postMessage({
						kind: 'parse-value-sections-result',
						requestId,
						parsed: incoming.payload.parsed,
					});
				};

				const responseTimeout = setTimeout(() => {
					webIpcMain.off('extensions', listener);
					record.worker.postMessage({
						kind: 'parse-value-sections-error',
						requestId,
						error: { code: 'parse_value_sections_timeout', message: 'renderer did not respond in time' },
					});
				}, CALL_TIMEOUT_MS);

				webIpcMain.on('extensions', listener);

				service.variableParseValueSections(webIpcMain.webContents, {
					uniqueSessionId,
					context: ctx,
					parts,
					recursiveDepth: 0,
				});
				return;
			}

			if (message.kind === 'log') {
				const level = (message.level as string) || 'info';
				const text = `[${message.packageName}] ${message.message}`;
				const logger = getRuntime().p.logger as unknown as Record<string, (m: string) => void>;
				(logger[level] ?? logger.warn)(text);
				return;
			}
		});
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
		record.worker.terminate();
	} catch {
		/* already terminated */
	}

	for (const pending of record.pendingCalls.values()) {
		pending.reject(new Squawk('extension_terminated', {}));
	}
	record.pendingCalls.clear();
}

export function getExtensionsDir(projectFolderPath: string): string {
	const path = getRuntime().p.node.path;
	return path.join(projectFolderPath, 'extensions');
}
