import type { Context, ValueSections } from '@getbeak/types/values';
// biome-ignore lint/style/noRestrictedImports: type-only imports of the SDK's UI contract used in cross-process payloads.
import type { UISection } from '@getbeak/extension-sdk';
import type { WebContents } from 'electron';

import type {
	AvailableUpdate,
	Extension,
	ExtensionOperation,
	ExtensionSearchResult,
	LoadedExtension,
} from '../types/extensions';
import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

export const ExtensionsMessages = {
	/* Management */
	List: 'list',
	Install: 'install',
	Remove: 'remove',
	Update: 'update',
	CheckUpdates: 'check_updates',
	Search: 'search',
	OperationChanged: 'operation_changed',

	/* Variable runtime */
	VariableCreateDefaultPayload: 'variable_create_default_payload',
	VariableGetValue: 'variable_get_value',
	VariableGetAssetRef: 'variable_get_asset_ref',
	VariableEditorCreateUI: 'variable_editor_create_ui',
	VariableEditorLoad: 'variable_editor_load',
	VariableEditorSave: 'variable_editor_save',
	VariableParseValueSections: 'variable_parse_value_sections',
	VariableParseValueSectionsResponse: 'variable_parse_value_sections_response',
} as const;

/* -------------------------------------------------------------------------- */
/*  Management payloads                                                       */
/* -------------------------------------------------------------------------- */

export interface InstallExtensionPayload {
	packageName: string;
	/** Semver range, exact version, or dist-tag. Defaults to `latest`. */
	versionRange?: string;
}

export interface RemoveExtensionPayload {
	packageName: string;
}

export interface UpdateExtensionPayload {
	packageName: string;
	/** Optional target. Defaults to `latest`. */
	versionRange?: string;
}

export interface SearchExtensionsPayload {
	query: string;
	limit?: number;
}

/* -------------------------------------------------------------------------- */
/*  Variable runtime payloads                                                 */
/* -------------------------------------------------------------------------- */

interface VariableBase {
	type: string;
	context: Context;
}

export interface VariableCreateDefaultPayloadPayload extends VariableBase {}

export interface VariableGetValuePayload extends VariableBase {
	payload: Record<string, unknown>;
	recursiveDepth: number;
}

export interface VariableGetAssetRefPayload extends VariableBase {
	payload: Record<string, unknown>;
	recursiveDepth: number;
}

export interface VariableEditorCreateUIPayload extends VariableBase {}

export interface VariableEditorLoadPayload extends VariableBase {
	payload: unknown;
}

export interface VariableEditorSavePayload extends VariableBase {
	existingPayload: unknown;
	state: unknown;
}

export interface VariableParseValueSections extends Omit<VariableBase, 'type'> {
	uniqueSessionId: string;
	recursiveDepth: number;
	parts: ValueSections;
}

export interface VariableParseValueSectionsResponse {
	uniqueSessionId: string;
	parsed: string;
}

/* -------------------------------------------------------------------------- */
/*  Renderer side                                                             */
/* -------------------------------------------------------------------------- */

export class IpcExtensionsServiceRenderer extends IpcServiceRenderer<'extensions'> {
	constructor(ipc: PartialIpcRenderer) {
		super('extensions', ipc);
	}

	/* ---- Management ----------------------------------------------------- */

	async list(): Promise<Extension[]> {
		return await this.invoke(ExtensionsMessages.List, {});
	}

	async install(payload: InstallExtensionPayload): Promise<LoadedExtension> {
		return await this.invoke(ExtensionsMessages.Install, payload);
	}

	async remove(payload: RemoveExtensionPayload): Promise<void> {
		await this.invoke(ExtensionsMessages.Remove, payload);
	}

	async update(payload: UpdateExtensionPayload): Promise<LoadedExtension> {
		return await this.invoke(ExtensionsMessages.Update, payload);
	}

	async checkUpdates(): Promise<AvailableUpdate[]> {
		return await this.invoke(ExtensionsMessages.CheckUpdates, {});
	}

	async search(payload: SearchExtensionsPayload): Promise<ExtensionSearchResult[]> {
		return await this.invoke(ExtensionsMessages.Search, payload);
	}

	registerOperationChanged(fn: IpcListener<{ packageName: string; operation: ExtensionOperation | null }>) {
		this.registerListener(ExtensionsMessages.OperationChanged, fn);
	}

	/* ---- Variable runtime ---------------------------------------------- */

	async variableCreateDefaultPayload(payload: VariableCreateDefaultPayloadPayload): Promise<Record<string, unknown>> {
		return await this.invoke(ExtensionsMessages.VariableCreateDefaultPayload, payload);
	}

	async variableGetValue(payload: VariableGetValuePayload): Promise<string> {
		return await this.invoke(ExtensionsMessages.VariableGetValue, payload);
	}

	async variableGetAssetRef(
		payload: VariableGetAssetRefPayload,
	): Promise<{ sha256: string; size: number; contentType?: string } | null> {
		return await this.invoke(ExtensionsMessages.VariableGetAssetRef, payload);
	}

	async variableEditorCreateUI(payload: VariableEditorCreateUIPayload): Promise<UISection[]> {
		return await this.invoke(ExtensionsMessages.VariableEditorCreateUI, payload);
	}

	async variableEditorLoad(payload: VariableEditorLoadPayload): Promise<unknown> {
		return await this.invoke(ExtensionsMessages.VariableEditorLoad, payload);
	}

	async variableEditorSave(payload: VariableEditorSavePayload): Promise<unknown> {
		return await this.invoke(ExtensionsMessages.VariableEditorSave, payload);
	}

	registerVariableParseValueSections(fn: IpcListener<VariableParseValueSections>) {
		this.registerListener(ExtensionsMessages.VariableParseValueSections, fn);
	}
}

/* -------------------------------------------------------------------------- */
/*  Main side                                                                 */
/* -------------------------------------------------------------------------- */

export class IpcExtensionsServiceMain extends IpcServiceMain<'extensions'> {
	constructor(ipc: PartialIpcMain) {
		super('extensions', ipc);
	}

	/* ---- Management ----------------------------------------------------- */

	registerList(fn: IpcListener<Record<string, never>>) {
		this.registerRequestHandler(ExtensionsMessages.List, fn);
	}

	registerInstall(fn: IpcListener<InstallExtensionPayload>) {
		this.registerRequestHandler(ExtensionsMessages.Install, fn);
	}

	registerRemove(fn: IpcListener<RemoveExtensionPayload>) {
		this.registerRequestHandler(ExtensionsMessages.Remove, fn);
	}

	registerUpdate(fn: IpcListener<UpdateExtensionPayload>) {
		this.registerRequestHandler(ExtensionsMessages.Update, fn);
	}

	registerCheckUpdates(fn: IpcListener<Record<string, never>>) {
		this.registerRequestHandler(ExtensionsMessages.CheckUpdates, fn);
	}

	registerSearch(fn: IpcListener<SearchExtensionsPayload>) {
		this.registerRequestHandler(ExtensionsMessages.Search, fn);
	}

	operationChanged(wc: WebContents, payload: { packageName: string; operation: ExtensionOperation | null }) {
		this.sendMessage(wc, ExtensionsMessages.OperationChanged, payload);
	}

	/* ---- Variable runtime ---------------------------------------------- */

	registerVariableCreateDefaultPayload(fn: IpcListener<VariableCreateDefaultPayloadPayload>) {
		this.registerRequestHandler(ExtensionsMessages.VariableCreateDefaultPayload, fn);
	}

	registerVariableGetValue(fn: IpcListener<VariableGetValuePayload>) {
		this.registerRequestHandler(ExtensionsMessages.VariableGetValue, fn);
	}

	registerVariableGetAssetRef(fn: IpcListener<VariableGetAssetRefPayload>) {
		this.registerRequestHandler(ExtensionsMessages.VariableGetAssetRef, fn);
	}

	registerVariableEditorCreateUI(fn: IpcListener<VariableEditorCreateUIPayload>) {
		this.registerRequestHandler(ExtensionsMessages.VariableEditorCreateUI, fn);
	}

	registerVariableEditorLoad(fn: IpcListener<VariableEditorLoadPayload>) {
		this.registerRequestHandler(ExtensionsMessages.VariableEditorLoad, fn);
	}

	registerVariableEditorSave(fn: IpcListener<VariableEditorSavePayload>) {
		this.registerRequestHandler(ExtensionsMessages.VariableEditorSave, fn);
	}

	variableParseValueSections(wc: WebContents, payload: VariableParseValueSections) {
		this.sendMessage(wc, ExtensionsMessages.VariableParseValueSections, payload);
	}
}
