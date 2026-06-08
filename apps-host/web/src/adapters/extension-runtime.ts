import type { Extension } from '@beak/common/types/extensions';
import ExtensionRuntime, { type ExtensionSender } from '@beak/runtime-shared/ports/extension-runtime';
import type { ResolvedValue, Sink } from '@getbeak/extension-sdk';
import type { Context as VariableContext } from '@getbeak/types/values';

import type WebExtensionManager from '../lib/extension/manager';

/**
 * Web adapter for the `ExtensionRuntime` port.
 *
 * Wraps `WebExtensionManager` (Web Workers) and exposes the port's abstract
 * interface. The web host's `capabilities.extensions = true` so this adapter
 * is active, but note that `variableResolve` receives an `ExtensionSender`
 * that is intentionally ignored — the worker manages its own
 * `parseValueSections` round-trip via `webIpcMain` without needing the
 * per-call sender.
 *
 * ADR 0006 §3.
 */
export default class WebExtensionRuntime extends ExtensionRuntime {
	private readonly manager: WebExtensionManager;

	constructor(manager: WebExtensionManager) {
		super();
		this.manager = manager;
	}

	async load(projectId: string, _projectFolder: string, packagePath: string): Promise<void> {
		await this.manager.load(projectId, packagePath);
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

	async variableResolve(
		projectId: string,
		type: string,
		varCtx: VariableContext,
		sender: ExtensionSender,
		payload: unknown,
		recursiveDepth: number,
		sink: Sink,
	): Promise<ResolvedValue> {
		return await this.manager.variableResolve(projectId, type, varCtx, sender, payload, recursiveDepth, sink);
	}

	async variableEditorCreateUI(projectId: string, type: string, varCtx: VariableContext): Promise<unknown> {
		return await this.manager.variableEditorCreateUI(projectId, type, varCtx);
	}

	async variableEditorLoad(
		projectId: string,
		type: string,
		varCtx: VariableContext,
		payload: unknown,
	): Promise<unknown> {
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
