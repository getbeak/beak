import { IpcMain, IpcRenderer } from 'electron';

import { IpcServiceMain, IpcServiceRenderer, Listener } from './ipc';

export const EncryptionMessages = {
	CheckStatus: 'check_status',
	SubmitKey: 'submit_key',
	GenerateIv: 'generate_iv',
	EncryptString: 'encrypt_string',
	DecryptString: 'decrypt_string',
};

export interface EncryptStringReq {
	payload: string;
	projectFolder: string;
	iv: string;
}

export interface DecryptStringReq {
	payload: string;
	projectFolder: string;
	iv: string;
}

export interface SubmitKeyReq {
	key: string;
	projectFolder: string;
}

export class IpcEncryptionServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: IpcRenderer) {
		super('encryption', ipc);
	}

	async checkStatus(projectPath: string) {
		return this.invoke<boolean>(EncryptionMessages.CheckStatus, projectPath);
	}

	async submitKey(payload: SubmitKeyReq) {
		return this.invoke<boolean>(EncryptionMessages.SubmitKey, payload);
	}

	async generateIv() {
		return this.invoke<string>(EncryptionMessages.GenerateIv);
	}

	async encryptString(payload: EncryptStringReq) {
		return this.invoke<string>(EncryptionMessages.EncryptString, payload);
	}

	async decryptString(payload: DecryptStringReq) {
		return this.invoke<string>(EncryptionMessages.DecryptString, payload);
	}
}

export class IpcEncryptionServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('encryption', ipc);
	}

	registerCheckStatus(fn: Listener<string, boolean>) {
		this.registerListener(EncryptionMessages.CheckStatus, fn);
	}

	registerSubmitKey(fn: Listener<SubmitKeyReq, boolean>) {
		this.registerListener(EncryptionMessages.SubmitKey, fn);
	}

	registerGenerateIv(fn: Listener<void, string>) {
		this.registerListener(EncryptionMessages.GenerateIv, fn);
	}

	registerEncryptString(fn: Listener<EncryptStringReq, string>) {
		this.registerListener(EncryptionMessages.EncryptString, fn);
	}

	registerDecryptString(fn: Listener<DecryptStringReq, string>) {
		this.registerListener(EncryptionMessages.DecryptString, fn);
	}
}
