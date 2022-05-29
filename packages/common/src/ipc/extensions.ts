import type { IpcMain } from 'electron';
import { Context } from '@getbeak/types/values';

import { IpcServiceMain, IpcServiceRenderer, Listener, PartialIpcRenderer } from './ipc';
import { RealtimeValue, UISection } from '@getbeak/types-realtime-value';

export const ExtensionsMessages = {
	RegisterRtv: 'register_rtv',
	RtvCreateDefaultValue: 'rtv_create_default_payload',
	RtvGetValue: 'rtv_get_value',
	RtvEditorCreateUserInterface: 'rtv_editor_create_user_interface',
	RtvEditorLoad: 'rtv_editor_load',
	RtvEditorSave: 'rtv_editor_save',
};

interface RegisterRtvPayload { extensionFilePath: string }

interface RtvCreateDefaultValuePayload {
	type: string;
	context: Context;
}

interface RtvGetValuePayload {
	type: string;
	context: Context;
	payload: Record<string, any>;
	recursiveSet: string[];
}

interface RtvEditorCreateUserInterface {
	context: Context;
}

interface RtvEditorLoad {
	context: Context;
	payload: unknown;
}

interface RtvEditorSave {
	context: Context;
	existingPayload: unknown;
	state: unknown;
}

export class IpcExtensionsServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: PartialIpcRenderer) {
		super('extensions', ipc);
	}

	async registerRtv(payload: RegisterRtvPayload): Promise<RealtimeValue | null> {
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
}

export class IpcExtensionsServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('extensions', ipc);
	}

	registerRegisterRtv(fn: Listener<RegisterRtvPayload, RealtimeValue | null>) {
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
}
