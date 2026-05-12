import type { Context, ValueSections } from '@getbeak/types/values';
import type { UISection } from '@getbeak/extension-sdk';
import type { WebContents } from 'electron';

import type { VariableExtension } from '../types/extensions';
import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

export const ExtensionsMessages = {
	RegisterRtv: 'register_rtv',
	RtvCreateDefaultValue: 'rtv_create_default_payload',
	RtvGetValue: 'rtv_get_value',
	RtvEditorCreateUserInterface: 'rtv_editor_create_user_interface',
	RtvEditorLoad: 'rtv_editor_load',
	RtvEditorSave: 'rtv_editor_save',
	RtvParseValueSections: 'rtv_parse_value_parts',
	RtvParseValueSectionsResponse: 'rtv_parse_value_parts_response',
};

interface RegisterRtvPayload {
	extensionFilePath: string;
}

interface RtvBase {
	type: string;
	context: Context;
}

interface RtvCreateDefaultValuePayload extends RtvBase {}

interface RtvGetValuePayload extends RtvBase {
	payload: Record<string, any>;
	recursiveDepth: number;
}

interface RtvEditorCreateUserInterface extends RtvBase {}

interface RtvEditorLoad extends RtvBase {
	payload: unknown;
}

interface RtvEditorSave extends RtvBase {
	existingPayload: unknown;
	state: unknown;
}

export interface RtvParseValueSections extends Omit<RtvBase, 'type'> {
	uniqueSessionId: string;
	recursiveDepth: number;
	parts: ValueSections;
}

export interface RtvParseValueSectionsResponse {
	uniqueSessionId: string;
	parsed: string;
}

export class IpcExtensionsServiceRenderer extends IpcServiceRenderer<'extensions'> {
	constructor(ipc: PartialIpcRenderer) {
		super('extensions', ipc);
	}

	async registerRtv(payload: RegisterRtvPayload): Promise<VariableExtension> {
		return await this.invoke(ExtensionsMessages.RegisterRtv, payload);
	}

	async rtvCreateDefaultPayload(payload: RtvCreateDefaultValuePayload): Promise<Record<string, any>> {
		return await this.invoke(ExtensionsMessages.RtvCreateDefaultValue, payload);
	}

	async rtvGetValue(payload: RtvGetValuePayload): Promise<string> {
		return await this.invoke(ExtensionsMessages.RtvGetValue, payload);
	}

	async rtvEditorCreateUserInterface(payload: RtvEditorCreateUserInterface): Promise<UISection[]> {
		return await this.invoke(ExtensionsMessages.RtvEditorCreateUserInterface, payload);
	}

	async rtvEditorLoad(payload: RtvEditorLoad): Promise<any> {
		return await this.invoke(ExtensionsMessages.RtvEditorLoad, payload);
	}

	async rtvEditorSave(payload: RtvEditorSave): Promise<any> {
		return await this.invoke(ExtensionsMessages.RtvEditorSave, payload);
	}

	registerRtvParseValueSections(fn: IpcListener<RtvParseValueSections>) {
		this.registerListener(ExtensionsMessages.RtvParseValueSections, fn);
	}
}

export class IpcExtensionsServiceMain extends IpcServiceMain<'extensions'> {
	constructor(ipc: PartialIpcMain) {
		super('extensions', ipc);
	}

	registerRegisterRtv(fn: IpcListener<RegisterRtvPayload>) {
		this.registerRequestHandler(ExtensionsMessages.RegisterRtv, fn);
	}

	registerRtvCreateDefaultPayload(fn: IpcListener<RtvCreateDefaultValuePayload>) {
		this.registerRequestHandler(ExtensionsMessages.RtvCreateDefaultValue, fn);
	}

	registerRtvGetValuePayload(fn: IpcListener<RtvGetValuePayload>) {
		this.registerRequestHandler(ExtensionsMessages.RtvGetValue, fn);
	}

	registerRtvEditorCreateUserInterface(fn: IpcListener<RtvEditorCreateUserInterface>) {
		this.registerRequestHandler(ExtensionsMessages.RtvEditorCreateUserInterface, fn);
	}

	registerRtvEditorLoad(fn: IpcListener<RtvEditorLoad>) {
		this.registerRequestHandler(ExtensionsMessages.RtvEditorLoad, fn);
	}

	registerRtvEditorSave(fn: IpcListener<RtvEditorSave>) {
		this.registerRequestHandler(ExtensionsMessages.RtvEditorSave, fn);
	}

	rtvParseValueSections(wc: WebContents, payload: RtvParseValueSections) {
		this.sendMessage(wc, ExtensionsMessages.RtvParseValueSections, payload);
	}
}
