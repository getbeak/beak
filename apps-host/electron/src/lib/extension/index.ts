import path from 'node:path';

import { ensureWithinProject } from '@beak/apps-host-electron/ipc-layer/fs-service';
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
} from '@beak/runtime-shared/extensions';
import type { ExtensionSender } from '@beak/runtime-shared/ports/extension-runtime';
import type { ResolvedValue, Sink } from '@getbeak/extension-sdk';
import type { ValueSections, Context as VariableContext } from '@getbeak/types/values';
import { ipcMain } from 'electron';
import fs from 'fs-extra';
import ivm from 'isolated-vm';
import { Logger } from 'tslog';

import getBeakHost from '../../host';
import { type LogLevel, setupLoggerForFsLogging } from '../logger';

type RequestPayload<T> = IpcMessage<T>;

interface IsolateRecord {
	isolate: ivm.Isolate;
	context: ivm.Context;
	/** Map of fully-qualified type (`external:<pkg>/<id>`) → callable handles inside the isolate. */
	variables: Record<string, VariableHandles>;
	loaded: LoadedExtension;
}

interface VariableHandles {
	createDefaultPayload: ivm.Reference;
	resolve: ivm.Reference;
	editor: {
		createUserInterface: ivm.Reference;
		load: ivm.Reference | null;
		save: ivm.Reference | null;
	} | null;
}

const logger = new Logger({ name: 'extensions' });
setupLoggerForFsLogging(logger, 'extensions');

const ISOLATE_MEMORY_LIMIT_MB = 64;
const ISOLATE_BOOT_TIMEOUT_MS = 2_000;
const PARSE_VALUE_SECTIONS_TIMEOUT_MS = 30_000;

/* -------------------------------------------------------------------------- */
/*  Bootstrap shim                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Wrapper script run inside each extension's isolate. Provides a minimal
 * CommonJS-flavoured environment, materialises a host-backed
 * `ExtensionContext`, binds it to every user callback so the SDK's
 * `(extCtx, rctx, payload)` signature works naturally, and exposes
 * copyable metadata + callable wrappers back to the host.
 *
 * `${USER_SOURCE}` is substituted with the extension's bundled main.
 *
 * The script ends by evaluating to `undefined`; the host reads
 * `__beak_metadata` (copyable) and `__beak_handles` (reference) off the
 * global after execution.
 *
 * Returned {@link ResolvedValue} kinds are copied across the isolate
 * boundary. `text` and `asset` round-trip trivially; `bytes`
 * (`Uint8Array`) copies but is heavy if large. `stream`
 * (`ReadableStream`) is NOT copyable — extensions returning streams
 * fail at the boundary, deferred until cross-isolate stream protocol
 * lands.
 */
function buildBootScript(userSource: string): string {
	return `
(function () {
	const module = { exports: {} };
	const exports = module.exports;

	const extCtx = {
		log: (level, message) => {
			try { __beak_log.applyIgnored(undefined, [String(level), String(message)]); }
			catch (e) { /* swallow — logger failures must not crash the extension */ }
		},
		parseValueSections: (varCtx, parts) =>
			__beak_parseValueSections.apply(undefined, [varCtx, parts], {
				arguments: { copy: true },
				result: { copy: true, promise: true },
			}),
	};

	(function (module, exports) {
		${userSource}
	})(module, exports);

	const raw = (module.exports && (module.exports.default ?? module.exports));
	if (!raw || typeof raw !== 'object')
		throw new Error('Extension did not export a definition. Did you forget to export default defineExtension(...)?');

	if (raw.apiVersion !== 2)
		throw new Error('Extension declared an unsupported apiVersion: ' + raw.apiVersion);

	if (!Array.isArray(raw.variables) || raw.variables.length === 0)
		throw new Error('Extension does not contribute any variables.');

	const metadata = [];
	const handles = {};

	for (const variable of raw.variables) {
		if (typeof variable.id !== 'string' || variable.id.length === 0)
			throw new Error('A contributed variable is missing its id.');
		if (typeof variable.name !== 'string')
			throw new Error('Variable ' + variable.id + ' is missing a name.');
		if (typeof variable.description !== 'string')
			throw new Error('Variable ' + variable.id + ' is missing a description.');
		if (typeof variable.createDefaultPayload !== 'function')
			throw new Error('Variable ' + variable.id + ' is missing createDefaultPayload.');
		if (typeof variable.resolve !== 'function')
			throw new Error('Variable ' + variable.id + ' is missing resolve.');

		const editor = variable.editor && typeof variable.editor === 'object'
			? {
				createUserInterface: typeof variable.editor.createUserInterface === 'function'
					? variable.editor.createUserInterface : null,
				load: typeof variable.editor.load === 'function' ? variable.editor.load : null,
				save: typeof variable.editor.save === 'function' ? variable.editor.save : null,
			}
			: null;

		if (editor && !editor.createUserInterface)
			throw new Error('Variable ' + variable.id + ' has an editor without createUserInterface.');

		metadata.push({
			variableId: variable.id,
			name: variable.name,
			description: variable.description,
			sensitive: Boolean(variable.sensitive),
			keywords: Array.isArray(variable.keywords) ? variable.keywords.slice() : [],
			attributes: variable.attributes && typeof variable.attributes === 'object'
				? { requiresRequestId: Boolean(variable.attributes.requiresRequestId) }
				: { requiresRequestId: false },
			editable: Boolean(editor),
		});

		handles[variable.id] = {
			createDefaultPayload: (varCtx) => variable.createDefaultPayload(extCtx, varCtx),
			resolve: (rctx, payload) => variable.resolve(extCtx, rctx, payload),
			editor: editor ? {
				createUserInterface: (varCtx) => editor.createUserInterface(extCtx, varCtx),
				load: editor.load ? (varCtx, payload) => editor.load(extCtx, varCtx, payload) : null,
				save: editor.save ? (varCtx, existing, state) => editor.save(extCtx, varCtx, existing, state) : null,
			} : null,
		};
	}

	global.__beak_metadata = new __beak_ivm_ExternalCopy(metadata).copyInto();
	global.__beak_handles = handles;
})();
`;
}

/* -------------------------------------------------------------------------- */
/*  Manager                                                                   */
/* -------------------------------------------------------------------------- */

export default class ExtensionManager {
	private readonly registry = new ProjectExtensionRegistry<IsolateRecord>({
		dispose: disposeIsolate,
	});
	private readonly service: IpcExtensionsServiceMain;

	constructor(service: IpcExtensionsServiceMain) {
		this.service = service;
	}

	/**
	 * Reset every isolate for a project. Used by the management IPC when
	 * the on-disk extensions/ tree has been mutated and the renderer is
	 * about to re-register everything.
	 */
	async resetProject(projectId: string): Promise<void> {
		await this.registry.resetProject(projectId);
	}

	/**
	 * Load an extension into its own isolate, validate the contributed
	 * variables, and return a `LoadedExtension` describing what's
	 * available. Idempotent — re-loading the same package replaces its
	 * isolate cleanly.
	 */
	async load(projectFolder: string, projectId: string, extensionPath: string): Promise<LoadedExtension> {
		const manifests = new ExtensionManifests(getBeakHost().providers);
		const manifest = await manifests.parse(extensionPath, {
			validateScriptPath: async scriptPath => {
				await ensureWithinProject(projectFolder, scriptPath);
			},
		});
		const userSource = await fs.readFile(manifest.scriptPath, 'utf8');

		const isolate = new ivm.Isolate({ memoryLimit: ISOLATE_MEMORY_LIMIT_MB });
		const context = await isolate.createContext();
		const global = context.global;

		await global.set('global', global.derefInto());

		// Wire host helpers used by the bootstrap script and the extCtx wrapper.
		await global.set(
			'__beak_log',
			new ivm.Reference((level: LogLevel, message: string) => {
				const fn = (logger as unknown as Record<string, (m: string) => void>)[level] ?? logger.warn.bind(logger);
				fn(`[${manifest.packageName}] ${message}`);
			}),
		);

		// Placeholder — re-bound per call by `variableResolve` so the right
		// webContents receives the parse callback.
		await global.set('__beak_parseValueSections', new ivm.Reference(async () => ''));

		// Expose isolated-vm constructors inside the isolate for the bootstrap shim.
		await global.set('__beak_ivm_ExternalCopy', ivm.ExternalCopy);
		await global.set('__beak_ivm_Reference', ivm.Reference);

		const script = await isolate.compileScript(buildBootScript(userSource));
		try {
			await script.run(context, { timeout: ISOLATE_BOOT_TIMEOUT_MS });
		} catch (err) {
			// Bootstrap-script errors are typed `Error` on the way out of
			// isolated-vm; the message carries the diagnostic. Re-throw as a
			// Squawk so the renderer can branch on the code (matches the web
			// host's `beakError(...)` path and the ADR-0007 contract).
			const message = err instanceof Error ? err.message : String(err);
			if (message.includes('unsupported apiVersion')) {
				throw new Squawk('extension_unsupported_api_version', {
					packageName: manifest.packageName,
					detail: message,
				});
			}
			throw new Squawk('extension_bootstrap_failed', {
				packageName: manifest.packageName,
				detail: message,
			});
		}

		const metadataRaw = (await global.get('__beak_metadata', { copy: true })) as ExtensionVariable[] | undefined;
		const handlesRef = (await global.get('__beak_handles', { reference: true })) as ivm.Reference | undefined;

		if (!metadataRaw || !handlesRef)
			throw new Squawk('extension_bootstrap_incomplete', { packageName: manifest.packageName });

		const variables: ExtensionVariable[] = metadataRaw.map(meta => ({
			...meta,
			type: makeFullyQualifiedType(manifest.packageName, meta.variableId),
		}));

		const variableHandles: Record<string, VariableHandles> = {};
		for (const meta of variables) {
			const variableRef = await handlesRef.get(meta.variableId, { reference: true });
			if (!variableRef) throw new Squawk('extension_variable_handle_missing', { variableId: meta.variableId });

			variableHandles[meta.type] = {
				createDefaultPayload: await variableRef.get('createDefaultPayload', { reference: true }),
				resolve: await variableRef.get('resolve', { reference: true }),
				editor: meta.editable
					? {
							createUserInterface: await (await variableRef.get('editor', { reference: true })).get('createUserInterface', {
								reference: true,
							}),
							load: await tryGetMember(variableRef, 'editor', 'load'),
							save: await tryGetMember(variableRef, 'editor', 'save'),
						}
					: null,
			};
		}

		const loaded: LoadedExtension = {
			status: 'loaded',
			packageName: manifest.packageName,
			version: manifest.version,
			displayName: manifest.displayName,
			description: manifest.description,
			author: manifest.author,
			homepage: manifest.homepage,
			filePath: extensionPath,
			apiVersion: 2,
			variables,
		};

		// Hand the record to the shared registry — it manages dispose-on-replace
		// and the projects bucket. Per-project lifecycle (resetProject, unload,
		// list, resolve) is identical across both hosts and now lives there.
		await this.registry.insert(projectId, manifest.packageName, {
			isolate,
			context,
			variables: variableHandles,
			loaded,
		});

		return loaded;
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
		const { handles } = this.resolve(projectId, type);
		return await callIntoIsolate(handles.createDefaultPayload, [varCtx]);
	}

	async variableResolve(
		projectId: string,
		type: string,
		varCtx: VariableContext,
		sender: ExtensionSender,
		payload: unknown,
		recursiveDepth: number,
		sink: Sink,
	): Promise<ResolvedValue> {
		const { handles, record } = this.resolve(projectId, type);

		await this.bindParseValueSections(record, sender, recursiveDepth);

		return await callIntoIsolate(handles.resolve, [{ variableContext: varCtx, sink, depth: recursiveDepth }, payload]);
	}

	async variableEditorCreateUI(projectId: string, type: string, varCtx: VariableContext) {
		const { handles } = this.resolve(projectId, type);
		if (!handles.editor) throw new Squawk('extension_editor_missing', { type });

		return await callIntoIsolate(handles.editor.createUserInterface, [varCtx]);
	}

	async variableEditorLoad(projectId: string, type: string, varCtx: VariableContext, payload: unknown) {
		const { handles } = this.resolve(projectId, type);
		if (!handles.editor?.load) throw new Squawk('extension_editor_missing_method', { type, method: 'load' });

		return await callIntoIsolate(handles.editor.load, [varCtx, payload]);
	}

	async variableEditorSave(
		projectId: string,
		type: string,
		varCtx: VariableContext,
		existingPayload: unknown,
		state: unknown,
	) {
		const { handles } = this.resolve(projectId, type);
		if (!handles.editor?.save) throw new Squawk('extension_editor_missing_method', { type, method: 'save' });

		return await callIntoIsolate(handles.editor.save, [varCtx, existingPayload, state]);
	}

	/* ---- Internals ----------------------------------------------------- */

	/**
	 * Look up the per-package record + per-type variable handles. The
	 * registry's `byPackage` returns the record; each host applies its
	 * own per-type lookup (electron stores `variables[fullyQualifiedType]`).
	 */
	private resolve(projectId: string, type: string): { record: IsolateRecord; handles: VariableHandles } {
		const packageName = packageNameFromType(type);
		const record = this.registry.byPackage(projectId, packageName);
		const handles = record?.variables[type];
		if (!record || !handles) throw new Squawk('unknown_registered_extension', { projectId, type });
		return { record, handles };
	}

	private async bindParseValueSections(
		record: IsolateRecord,
		sender: ExtensionSender,
		recursiveDepth: number,
	): Promise<void> {
		const service = this.service;
		const ref = new ivm.Reference(async (varCtx: VariableContext, parts: ValueSections) => {
			const uniqueSessionId = ksuid.generate('rtvparsersp').toString();

			service.variableParseValueSectionsBySender(sender, {
				uniqueSessionId,
				context: varCtx,
				parts,
				recursiveDepth,
			});

			return await new Promise<string>((resolve, reject) => {
				const listener = (_event: unknown, message: unknown) => {
					const { code, payload } = message as RequestPayload<VariableParseValueSectionsResponse>;
					if (code !== ExtensionsMessages.VariableParseValueSectionsResponse) return;
					if (payload.uniqueSessionId !== uniqueSessionId) return;

					clearTimeout(timeoutHandle);
					ipcMain.off('extensions', listener);
					resolve(payload.parsed);
				};

				const timeoutHandle = setTimeout(() => {
					ipcMain.off('extensions', listener);
					reject(
						new Squawk('parse_value_sections_timeout', {
							uniqueSessionId,
							timeoutMs: PARSE_VALUE_SECTIONS_TIMEOUT_MS,
						}),
					);
				}, PARSE_VALUE_SECTIONS_TIMEOUT_MS);

				ipcMain.on('extensions', listener);
			});
		});

		await record.context.global.set('__beak_parseValueSections', ref);
	}
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

async function callIntoIsolate<TResult>(reference: ivm.Reference, args: unknown[]): Promise<TResult> {
	return (await reference.apply(undefined, args, {
		arguments: { copy: true },
		result: { copy: true, promise: true },
	})) as TResult;
}

async function tryGetMember(parent: ivm.Reference, group: string, member: string): Promise<ivm.Reference | null> {
	try {
		const groupRef = await parent.get(group, { reference: true });
		const memberRef = await groupRef.get(member, { reference: true });
		return memberRef.typeof === 'function' ? memberRef : null;
	} catch {
		return null;
	}
}

function disposeIsolate(record: IsolateRecord): void {
	try {
		record.context.release();
	} catch {
		/* already released */
	}

	try {
		record.isolate.dispose();
	} catch {
		/* already disposed */
	}
}

/**
 * Resolve `<projectFolder>/extensions/` reliably. Centralised here so the
 * management IPC handlers can share it.
 */
export function getExtensionsDir(projectFolderPath: string): string {
	return path.join(projectFolderPath, 'extensions');
}
