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
	WORKER_SOURCE,
	WorkerExtensionManager,
	type WorkerProvider,
} from '@beak/runtime-shared/extensions';
import type { ValueSections, Context as VariableContext } from '@getbeak/types/values';

import getRuntime from '../../host';
import { webIpcMain } from '../../ipc/ipc';

const PARSE_VALUE_SECTIONS_TIMEOUT_MS = 30_000;

/**
 * Web-shell extension manager — a thin adapter that supplies the shared
 * `WorkerExtensionManager` with a Web Worker provider, the IPC roundtrip
 * for recursive `parseValueSections` calls, and a logger sink. Public API
 * is unchanged from the previous bespoke implementation; callers in
 * `apps-host/web/src/ipc/extensions-service.ts` keep working untouched.
 *
 * `callerCtx` is `null` on the web — there is only one renderer process,
 * so there's nothing to demultiplex by.
 */
export default class WebExtensionManager extends WorkerExtensionManager<null> {
	constructor(service: IpcExtensionsServiceMain) {
		super({
			providers: getRuntime().providers,
			workerProvider: new WebWorkerProvider(),
			callbacks: {
				parseValueSections: (_callerCtx, varCtx, parts, recursiveDepth) =>
					parseValueSectionsViaWebIpc(service, varCtx, parts, recursiveDepth),
				log: (packageName, level, message) => {
					const logger = getRuntime().p.logger as unknown as Record<string, (m: string) => void>;
					(logger[level] ?? logger.warn)(`[${packageName}] ${message}`);
				},
			},
		});
	}
}

class WebWorkerProvider implements WorkerProvider {
	private blobUrl: string | null = null;

	spawn(name: string): UnifiedWorker {
		if (!this.blobUrl) {
			const blob = new Blob([WORKER_SOURCE], { type: 'application/javascript' });
			this.blobUrl = URL.createObjectURL(blob);
		}

		const worker = new Worker(this.blobUrl, { name });
		return new WebWorkerAdapter(worker);
	}
}

class WebWorkerAdapter implements UnifiedWorker {
	constructor(private readonly worker: Worker) {}

	postMessage(message: unknown): void {
		this.worker.postMessage(message);
	}

	onMessage(listener: (message: unknown) => void): () => void {
		const handler = (event: MessageEvent) => listener(event.data);
		this.worker.addEventListener('message', handler);
		return () => this.worker.removeEventListener('message', handler);
	}

	onError(listener: (error: unknown) => void): () => void {
		const handler = (event: ErrorEvent) => listener(event.error ?? event.message);
		this.worker.addEventListener('error', handler);
		return () => this.worker.removeEventListener('error', handler);
	}

	terminate(): void {
		this.worker.terminate();
	}
}

/**
 * Send a `parseValueSections` request to the renderer via the
 * extensions IPC channel and await the correlated response. Times out
 * after `PARSE_VALUE_SECTIONS_TIMEOUT_MS` — the SDK contract is "this
 * resolves eventually or surfaces an error", never "hangs forever".
 */
function parseValueSectionsViaWebIpc(
	service: IpcExtensionsServiceMain,
	varCtx: VariableContext,
	parts: ValueSections,
	recursiveDepth: number,
): Promise<string> {
	const uniqueSessionId = ksuid.generate('rtvparsersp').toString();

	return new Promise<string>((resolve, reject) => {
		const listener = (_event: unknown, raw: unknown) => {
			const incoming = raw as IpcMessage<VariableParseValueSectionsResponse>;
			if (incoming.code !== ExtensionsMessages.VariableParseValueSectionsResponse) return;
			if (incoming.payload.uniqueSessionId !== uniqueSessionId) return;

			cleanup();
			resolve(incoming.payload.parsed);
		};

		const timer = setTimeout(() => {
			cleanup();
			reject(new Squawk('parse_value_sections_timeout', { uniqueSessionId, timeoutMs: PARSE_VALUE_SECTIONS_TIMEOUT_MS }));
		}, PARSE_VALUE_SECTIONS_TIMEOUT_MS);

		function cleanup() {
			clearTimeout(timer);
			webIpcMain.off('extensions', listener);
		}

		webIpcMain.on('extensions', listener);

		service.variableParseValueSections(webIpcMain.webContents, {
			uniqueSessionId,
			context: varCtx,
			parts,
			recursiveDepth,
		});
	});
}

export function getExtensionsDir(projectFolderPath: string): string {
	const path = getRuntime().p.node.path;
	return path.join(projectFolderPath, 'extensions');
}
