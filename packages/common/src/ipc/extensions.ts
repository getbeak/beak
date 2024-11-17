import { Context, ValueSections } from '@getbeak/types/values';
import { UISection } from '@getbeak/types-variables';
import type { IpcMain, WebContents } from 'electron';

import { VariableExtension } from '../types/extensions';
import { IpcServiceMain, IpcServiceRenderer, Listener, PartialIpcRenderer } from './ipc';

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

interface RegisterRtvPayload { extensionFilePath: string }

interface RtvBase {
	type: string;
	context: Context;
}

interface RtvCreateDefaultValuePayload extends RtvBase { }

interface RtvGetValuePayload extends RtvBase {
	payload: Record<string, any>;
	recursiveDepth: number;
}

interface RtvEditorCreateUserInterface extends RtvBase { }

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

export class IpcExtensionsServiceRenderer extends IpcServiceRenderer {
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

	registerRtvParseValueSections(fn: Listener<RtvParseValueSections>) {
		this.registerListener(ExtensionsMessages.RtvParseValueSections, fn);
	}
}

export class IpcExtensionsServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('extensions', ipc);
	}

	registerRegisterRtv(fn: Listener<RegisterRtvPayload, VariableExtension>) {
		this.registerListener(ExtensionsMessages.RegisterRtv, fn);
	}

	registerRtvCreateDefaultPayload(fn: Listener<RtvCreateDefaultValuePayload, Record<string, any>>) {
		this.registerListener(ExtensionsMessages.RtvCreateDefaultValue, fn);
	}

	registerRtvGetValuePayload(fn: Listener<RtvGetValuePayload, string>) {
		this.registerListener(ExtensionsMessages.RtvGetValue, fn);
	}

	registerRtvEditorCreateUserInterface(fn: Listener<RtvEditorCreateUserInterface, UISection[]>) {
		this.registerListener(ExtensionsMessages.RtvEditorCreateUserInterface, fn);
	}

	registerRtvEditorLoad(fn: Listener<RtvEditorLoad, any>) {
		this.registerListener(ExtensionsMessages.RtvEditorLoad, fn);
	}

	registerRtvEditorSave(fn: Listener<RtvEditorSave, any>) {
		this.registerListener(ExtensionsMessages.RtvEditorSave, fn);
	}

	rtvParseValueSections(wc: WebContents, payload: RtvParseValueSections) {
		wc.send(this.channel, {
			code: ExtensionsMessages.RtvParseValueSections,
			payload,
		});
	}
}
