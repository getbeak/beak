import type { Extension } from '@beak/common/types/extensions';
import ExtensionRuntime, { type ExtensionSender } from '@beak/runtime-shared/ports/extension-runtime';
import type { Context as VariableContext } from '@getbeak/types/values';

import ExtensionManager from '../lib/extension';

/**
 * Electron adapter for the `ExtensionRuntime` port.
 *
 * Wraps `ExtensionManager` (isolated-vm) and exposes the port's abstract
 * interface. IPC handlers construct an `ExtensionSender` from the
 * `IpcMainInvokeEvent.sender` (`WebContents`) and pass it in; the manager
 * itself never sees Electron primitives.
 */
export default class ElectronExtensionRuntime extends ExtensionRuntime {
	private readonly manager: ExtensionManager;

	constructor(manager: ExtensionManager) {
		super();
		this.manager = manager;
	}

	async load(projectId: string, projectFolder: string, packagePath: string): Promise<void> {
		await this.manager.load(projectFolder, projectId, packagePath);
	}

	async unload(projectId: string, packageName: string): Promise<void> {
		await this.manager.unload(projectId, packageName);
	}

	async resetProject(projectId: string): Promise<void> {
		await this.manager.resetProject(projectId);
	}

	list(projectId: string): Extension[] {
		return this.manager.list(projectId);
	}

	async variableCreateDefaultPayload(
		projectId: string,
		type: string,
		varCtx: VariableContext,
	): Promise<Record<string, unknown>> {
		return await this.manager.variableCreateDefaultPayload(projectId, type, varCtx);
	}

	async variableGetValue(
		projectId: string,
		type: string,
		varCtx: VariableContext,
		sender: ExtensionSender,
		payload: unknown,
		recursiveDepth: number,
	): Promise<string> {
		return await this.manager.variableGetValue(projectId, type, varCtx, sender, payload, recursiveDepth);
	}

	async variableGetAssetRef(
		projectId: string,
		type: string,
		varCtx: VariableContext,
		sender: ExtensionSender,
		payload: unknown,
		recursiveDepth: number,
	): Promise<{ sha256: string; size: number; contentType?: string } | null> {
		return await this.manager.variableGetAssetRef(projectId, type, varCtx, sender, payload, recursiveDepth);
	}

	async variableEditorCreateUI(projectId: string, type: string, varCtx: VariableContext): Promise<unknown> {
		return await this.manager.variableEditorCreateUI(projectId, type, varCtx);
	}

	async variableEditorLoad(projectId: string, type: string, varCtx: VariableContext, payload: unknown): Promise<unknown> {
		return await this.manager.variableEditorLoad(projectId, type, varCtx, payload);
	}

	async variableEditorSave(
		projectId: string,
		type: string,
		varCtx: VariableContext,
		existingPayload: unknown,
		state: unknown,
	): Promise<unknown> {
		return await this.manager.variableEditorSave(projectId, type, varCtx, existingPayload, state);
	}
}
