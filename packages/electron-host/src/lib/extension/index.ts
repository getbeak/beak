import { IpcEvent } from '@beak/common/ipc/ipc';
import { RealtimeValueExtension } from '@beak/common/types/extensions';
import Squawk from '@beak/common/utils/squawk';
import { ensureWithinProject } from '@beak/electron-host/ipc-layer/fs-service';
import { getProjectWindowMapping } from '@beak/electron-host/ipc-layer/fs-shared';
import { Context } from '@getbeak/types/values';
import { EditableRealtimeValue } from '@getbeak/types-realtime-value/';
import fs from 'fs-extra';
import cd from 'lodash.clonedeep';
import path from 'path';
import { NodeVM, VMScript } from 'vm2';

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

export default class ExtensionManager {
	private readonly projectExtensions: ProjectExtensions = {};

	async registerRtv(event: IpcEvent, projectId: string, extensionPath: string): Promise<RealtimeValueExtension> {
		if (!this.projectExtensions[projectId])
			this.projectExtensions[projectId] = {};

		const { name, scriptPath, version } = await this.parseExtensionPackage(event, extensionPath);

		const scriptContent = await fs.readFile(scriptPath, 'utf8');
		const extensionVm = new NodeVM({
			console: 'off',
			wasm: false,
			eval: false,
			sandbox: {
				// TODO(afr): Pass in the proper sandbox context
				// eslint-disable-next-line no-console
				log: (level: unknown, message: string) => console.log({ level, message }),
				parseValueParts: (_ctx: unknown, _parts: unknown, _recursiveSet: unknown) => [],
			},
		});

		const compiledScript = new VMScript(scriptContent);
		const extensionContext = extensionVm.run(compiledScript);

		// TODO(afr): Run validation on output
		const extension = extensionContext.default as EditableRealtimeValue<any>;

		// Prefix added so malicious action can't replace built in sensitive RTVs
		const type = `external:${name}`;

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
					requiresRequestId: extension.attributes?.requiresRequestId,
				},
				editable: Boolean(extension.editor),
			},
		};
	}

	async rtvCreateDefaultPayload(projectId: string, type: string, context: Context) {
		const { extension } = this.getExtensionContext(projectId, type);
		const x = await extension.createDefaultPayload(context);

		return { ...x };
	}

	async rtvGetValue(projectId: string, type: string, context: Context, payload: any, recursiveSet: string[]) {
		const { extension } = this.getExtensionContext(projectId, type);

		return await extension.getValue(context, payload, new Set(recursiveSet));
	}

	async rtvCreateUserInterface(projectId: string, type: string, context: Context) {
		const { extension } = this.getExtensionContext(projectId, type);
		const uiSections = await extension.editor.createUserInterface(context);

		return cd(uiSections);
	}

	async rtvEditorLoad(projectId: string, type: string, context: Context, payload: unknown) {
		const { extension } = this.getExtensionContext(projectId, type);
		const editorState = await extension.editor.load(context, payload);

		return cd(editorState);
	}

	async rtvEditorSave(projectId: string, type: string, context: Context, existingPayload: unknown, state: unknown) {
		const { extension } = this.getExtensionContext(projectId, type);
		const payload = await extension.editor.save(context, existingPayload, state);

		return cd(payload);
	}

	private getExtensionContext(projectId: string, type: string) {
		const extensionStorage = this.projectExtensions[projectId]?.[type];

		if (!extensionStorage)
			throw new Squawk('unknown_registered_extension', { projectId, type });

		return { vm: extensionStorage.vm, extension: extensionStorage.extension };
	}

	private async parseExtensionPackage(event: IpcEvent, extensionPath: string) {
		const packageJsonPath = path.join(extensionPath, 'package.json');
		const packageJson = await fs.readJson(packageJsonPath);

		// TODO(afr): Parse this properly, with validation
		const { name, version, beakExtensionType, main } = packageJson;

		if (beakExtensionType !== 'realtime-value') {
			throw new Squawk('invalid_extension_type', {
				extensionPath,
				packageJsonKey: 'beakExtensionType',
				expected: 'realtime-value',
				actual: beakExtensionType ?? '[missing]',
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
}
