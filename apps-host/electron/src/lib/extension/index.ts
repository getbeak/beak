import { ExtensionsMessages, IpcExtensionsServiceMain, RtvParseValuePartsResponse } from '@beak/common/ipc/extensions';
import { IpcEvent, RequestPayload } from '@beak/common/ipc/ipc';
import { RealtimeValueExtension } from '@beak/common/types/extensions';
import Squawk from '@beak/common/utils/squawk';
import { ensureWithinProject } from '@beak/apps-host-electron/ipc-layer/fs-service';
import { getProjectWindowMapping } from '@beak/apps-host-electron/ipc-layer/fs-shared';
import ksuid from '@beak/ksuid';
import { Context, ValueParts } from '@getbeak/types/values';
import { EditableRealtimeValue } from '@getbeak/types-realtime-value/';
import { ipcMain, WebContents } from 'electron';
import fs from 'fs-extra';
import clone from 'lodash.clonedeep';
import path from 'path';
import { Logger } from 'tslog';
import { NodeVM, VMScript } from 'vm2';

import { LogLevel, setupLoggerForFsLogging } from '../logger';

interface ProjectExtensions {
	[projectId: string]: Record<string, RtvExtensionStorage>;
}

interface RtvExtensionStorage {
	type: string;
	version: string;
	scriptContent: string;
	vm: NodeVM;
	script: VMScript;
	extension: EditableRealtimeValue<any, any>;
}

const logger = new Logger({ name: 'extensions' });

setupLoggerForFsLogging(logger, 'extensions');

export default class ExtensionManager {
	private readonly projectExtensions: ProjectExtensions = {};
	private readonly extensionService: IpcExtensionsServiceMain;

	constructor(extensionService: IpcExtensionsServiceMain) {
		this.extensionService = extensionService;
	}

	async registerRtv(event: IpcEvent, projectId: string, extensionPath: string): Promise<RealtimeValueExtension> {
		if (!this.projectExtensions[projectId])
			this.projectExtensions[projectId] = {};

		// Prefix added so malicious action can't replace built in sensitive RTVs
		const { name, scriptPath, version } = await this.parseExtensionPackage(event, extensionPath);
		const type = `external:${name}`;

		const scriptContent = await fs.readFile(scriptPath, 'utf8');
		const extensionVm = new NodeVM({
			console: 'redirect',
			wasm: false,
			eval: false,
			sandbox: {
				beakApi: {
					log: (level: LogLevel, message: string) => (logger[level] ?? logger.warn)(message),
					parseValueParts: (_ctx: unknown, _parts: unknown, _recursiveSet: unknown) => [],
				},
			},
		});

		extensionVm.on('console.log', message => logger.info(`[${type}]`, message));
		extensionVm.on('console.dir', message => logger.info(`[${type}]`, message));
		extensionVm.on('console.info', message => logger.info(`[${type}]`, message));
		extensionVm.on('console.warn', message => logger.warn(`[${type}]`, message));
		extensionVm.on('console.error', message => logger.error(`[${type}]`, message));
		extensionVm.on('console.trace', message => logger.trace(`[${type}]`, message));

		const compiledScript = new VMScript(scriptContent);
		const extensionContext = extensionVm.run(compiledScript);
		const extension = extensionContext?.default as EditableRealtimeValue<any>;

		this.validateExtensionSignature(extension);
		this.projectExtensions[projectId][type] = {
			type,
			version,
			scriptContent,
			vm: extensionVm,
			script: compiledScript,
			extension,
		};

		return {
			name,
			version,
			filePath: extensionPath,
			valid: true,
			realtimeValue: {
				type,
				external: true,
				name: extension.name,
				description: extension.description,
				sensitive: extension.sensitive,
				attributes: {
					requiresRequestId: extension.attributes.requiresRequestId,
				},
				editable: Boolean(extension.editor),
			},
		};
	}

	async rtvCreateDefaultPayload(projectId: string, type: string, context: Context) {
		const { extension } = this.getExtensionContext(projectId, type);
		const x = await extension.createDefaultPayload(context);

		return clone(x);
	}

	async rtvGetValue(
		projectId: string,
		type: string,
		context: Context,
		webContents: WebContents,
		payload: unknown,
		recursiveDepth: number,
	) {
		const { vm, extension } = this.getExtensionContext(projectId, type);

		vm.sandbox.beakApi.parseValueParts = async (ctx: Context, parts: ValueParts) => {
			const uniqueSessionId = ksuid.generate('rtvparsersp').toString();

			// send IPC request
			this.extensionService.rtvParseValueParts(webContents, {
				uniqueSessionId,
				context: ctx,
				parts,
				recursiveDepth,
			});

			return await new Promise(resolve => {
				ipcMain.on(this.extensionService.getChannel(), async (_event, message) => {
					const { code, payload } = message as RequestPayload<RtvParseValuePartsResponse>;

					if (code !== ExtensionsMessages.RtvParseValuePartsResponse)
						return;

					if (payload.uniqueSessionId !== uniqueSessionId)
						return;

					resolve(payload.parsed);
				});
			});
		};

		return await extension.getValue(context, payload, recursiveDepth);
	}

	async rtvCreateUserInterface(projectId: string, type: string, context: Context) {
		const { extension } = this.getExtensionContext(projectId, type);
		const uiSections = await extension.editor.createUserInterface(context);

		return clone(uiSections);
	}

	async rtvEditorLoad(projectId: string, type: string, context: Context, payload: unknown) {
		const { extension } = this.getExtensionContext(projectId, type);
		const editorState = await extension.editor.load(context, payload);

		return clone(editorState);
	}

	async rtvEditorSave(projectId: string, type: string, context: Context, existingPayload: unknown, state: unknown) {
		const { extension } = this.getExtensionContext(projectId, type);
		const payload = await extension.editor.save(context, existingPayload, state);

		return clone(payload);
	}

	private getExtensionContext(projectId: string, type: string) {
		const extensionStorage = this.projectExtensions[projectId]?.[type];

		if (!extensionStorage)
			throw new Squawk('unknown_registered_extension', { projectId, type });

		extensionStorage.vm.sandbox.beakApi.parseValueParts = () => [];

		return { vm: extensionStorage.vm, extension: extensionStorage.extension };
	}

	private async parseExtensionPackage(event: IpcEvent, extensionPath: string) {
		const packageJsonPath = path.join(extensionPath, 'package.json');
		const packageJson = await fs.readJson(packageJsonPath);
		const { name, version, beakExtensionType, main } = packageJson;

		if (beakExtensionType !== 'realtime-value') {
			throw new Squawk('invalid_extension_type', {
				extensionPath,
				packageJsonKey: 'beakExtensionType',
				expected: 'realtime-value',
				actual: beakExtensionType ?? '[missing]',
			});
		}

		if (!name) {
			throw new Squawk('invalid_extension_package', {
				extensionPath,
				packageJsonKey: 'name',
				reason: 'name is missing',
			});
		}

		if (!version) {
			throw new Squawk('invalid_extension_package', {
				extensionPath,
				packageJsonKey: 'version',
				reason: 'version is missing',
			});
		}

		if (typeof main !== 'string') {
			throw new Squawk('invalid_extension_package', {
				extensionPath,
				packageJsonKey: 'main',
				reason: 'main is missing',
			});
		}

		const scriptPath = path.join(extensionPath, main);

		if (!await fs.pathExists(scriptPath)) {
			throw new Squawk('extension_main_missing', {
				extensionPath,
				packageJsonKey: 'main',
				expected: './path/to/script.js',
				actual: main ?? '[missing]',
			});
		}

		// Needed to ensure the `main` property isn't breaking out of the project directory
		await ensureWithinProject(getProjectWindowMapping(event), scriptPath);

		return { main, name, scriptPath, version };
	}

	private validateExtensionSignature(extension: EditableRealtimeValue<any>) {
		if (!('name' in extension))
			throw new Squawk('incorrect_extension_signature', { key: 'name', reason: 'missing' });
		if (typeof extension.name !== 'string')
			throw new Squawk('incorrect_extension_signature', { key: 'name', reason: 'wrong type' });

		if (!('description' in extension))
			throw new Squawk('incorrect_extension_signature', { key: 'description', reason: 'missing' });
		if (typeof extension.description !== 'string')
			throw new Squawk('incorrect_extension_signature', { key: 'description', reason: 'wrong type' });

		if (!('sensitive' in extension))
			throw new Squawk('incorrect_extension_signature', { key: 'sensitive', reason: 'missing' });
		if (typeof extension.sensitive !== 'boolean')
			throw new Squawk('incorrect_extension_signature', { key: 'sensitive', reason: 'wrong type' });

		if (!('attributes' in extension))
			throw new Squawk('incorrect_extension_signature', { key: 'attributes', reason: 'missing' });
		if (typeof extension.attributes !== 'object')
			throw new Squawk('incorrect_extension_signature', { key: 'attributes', reason: 'wrong type' });

		if (!('createDefaultPayload' in extension))
			throw new Squawk('incorrect_extension_signature', { key: 'createDefaultPayload', reason: 'missing' });
		if (typeof extension.createDefaultPayload !== 'function')
			throw new Squawk('incorrect_extension_signature', { key: 'createDefaultPayload', reason: 'wrong type' });

		if (!('getValue' in extension))
			throw new Squawk('incorrect_extension_signature', { key: 'getValue', reason: 'missing' });
		if (typeof extension.getValue !== 'function')
			throw new Squawk('incorrect_extension_signature', { key: 'getValue', reason: 'wrong type' });

		if ('editor' in extension) {
			if (!('createUserInterface' in extension.editor))
				throw new Squawk('incorrect_extension_signature', { key: 'editor.createUserInterface', reason: 'missing' });
			if (typeof extension.editor.createUserInterface !== 'function')
				throw new Squawk('incorrect_extension_signature', { key: 'editor.createUserInterface', reason: 'wrong type' });

			if (!('load' in extension.editor))
				throw new Squawk('incorrect_extension_signature', { key: 'editor.load', reason: 'missing' });
			if (typeof extension.editor.load !== 'function')
				throw new Squawk('incorrect_extension_signature', { key: 'editor.load', reason: 'wrong type' });

			if (!('save' in extension.editor))
				throw new Squawk('incorrect_extension_signature', { key: 'editor.save', reason: 'missing' });
			if (typeof extension.editor.save !== 'function')
				throw new Squawk('incorrect_extension_signature', { key: 'editor.save', reason: 'wrong type' });
		}
	}
}
