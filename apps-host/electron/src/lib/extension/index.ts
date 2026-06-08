import path from 'node:path';
import { Worker as NodeWorker } from 'node:worker_threads';

import {
	ExtensionsMessages,
	type IpcExtensionsServiceMain,
	type VariableParseValueSectionsResponse,
} from '@beak/common/ipc/extensions';
import type { IpcMessage } from '@beak/common/ipc/types';
import Squawk from '@beak/common/utils/squawk';
import ksuid from '@beak/ksuid';
import {
	type UnifiedWorker,
	WORKER_RUNTIME_NODE_SHIM,
	WORKER_SOURCE,
	WorkerExtensionManager,
	type WorkerProvider,
} from '@beak/runtime-shared/extensions';
import type { ValueSections, Context as VariableContext } from '@getbeak/types/values';
import { ipcMain, type WebContents } from 'electron';
import { Logger } from 'tslog';

import getBeakHost from '../../host';
import { setupLoggerForFsLogging } from '../logger';

const logger = new Logger({ name: 'extensions' });
setupLoggerForFsLogging(logger, 'extensions');

const PARSE_VALUE_SECTIONS_TIMEOUT_MS = 30_000;

/**
 * Electron extension manager — runs each extension in a `node:worker_threads`
 * Worker (one V8 isolate + event loop per extension), routes the worker's
 * recursive `parseValueSections` callbacks back through the renderer via
 * IPC, and logs via `tslog`. Replaces the legacy `isolated-vm` implementation;
 * see ADR-0003 for the rationale and trust-model details.
 *
 * `callerCtx` is `WebContents` — the renderer that initiated the call.
 * Stored per-worker so each `parse-value-sections` response targets the
 * right window when multiple project windows are open.
 */
export default class ExtensionManager extends WorkerExtensionManager<WebContents> {
	constructor(service: IpcExtensionsServiceMain) {
		super({
			providers: getBeakHost().providers,
			workerProvider: new NodeWorkerProvider(),
			callbacks: {
				parseValueSections: (callerCtx, varCtx, parts, recursiveDepth) =>
					parseValueSectionsViaIpc(service, callerCtx, varCtx, parts, recursiveDepth),
				log: (packageName, level, message) => {
					const fn = (logger as unknown as Record<string, (m: string) => void>)[level] ?? logger.warn.bind(logger);
					fn(`[${packageName}] ${message}`);
				},
			},
		});
	}
}

class NodeWorkerProvider implements WorkerProvider {
	spawn(name: string): UnifiedWorker {
		const fullSource = `${WORKER_RUNTIME_NODE_SHIM}\n${WORKER_SOURCE}`;
		const worker = new NodeWorker(fullSource, { eval: true, name });
		return new NodeWorkerAdapter(worker);
	}
}

class NodeWorkerAdapter implements UnifiedWorker {
	constructor(private readonly worker: NodeWorker) {}

	postMessage(message: unknown): void {
		this.worker.postMessage(message);
	}

	onMessage(listener: (message: unknown) => void): () => void {
		this.worker.on('message', listener);
		return () => this.worker.off('message', listener);
	}

	onError(listener: (error: unknown) => void): () => void {
		this.worker.on('error', listener);
		return () => this.worker.off('error', listener);
	}

	terminate(): Promise<unknown> {
		return this.worker.terminate();
	}
}

function parseValueSectionsViaIpc(
	service: IpcExtensionsServiceMain,
	webContents: WebContents,
	varCtx: VariableContext,
	parts: ValueSections,
	recursiveDepth: number,
): Promise<string> {
	const uniqueSessionId = ksuid.generate('rtvparsersp').toString();

	return new Promise<string>((resolve, reject) => {
		const listener = (_event: unknown, message: unknown) => {
			const { code, payload } = message as IpcMessage<VariableParseValueSectionsResponse>;
			if (code !== ExtensionsMessages.VariableParseValueSectionsResponse) return;
			if (payload.uniqueSessionId !== uniqueSessionId) return;

			cleanup();
			resolve(payload.parsed);
		};

		const timer = setTimeout(() => {
			cleanup();
			reject(new Squawk('parse_value_sections_timeout', { uniqueSessionId, timeoutMs: PARSE_VALUE_SECTIONS_TIMEOUT_MS }));
		}, PARSE_VALUE_SECTIONS_TIMEOUT_MS);

		function cleanup() {
			clearTimeout(timer);
			ipcMain.off('extensions', listener);
		}

		ipcMain.on('extensions', listener);

		service.variableParseValueSections(webContents, {
			uniqueSessionId,
			context: varCtx,
			parts,
			recursiveDepth,
		});
	});
}

/**
 * Resolve `<projectFolder>/extensions/` reliably. Centralised here so the
 * management IPC handlers can share it.
 */
export function getExtensionsDir(projectFolderPath: string): string {
	return path.join(projectFolderPath, 'extensions');
}
