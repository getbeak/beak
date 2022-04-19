import type { IpcMain } from 'electron';

import { IpcServiceMain, IpcServiceRenderer, Listener, PartialIpcRenderer } from './ipc';

export const EncryptionMessages = {
	CheckStatus: 'check_status',
	SubmitKey: 'submit_key',
	GenerateIv: 'generate_iv',
	EncryptString: 'encrypt_string',
	DecryptString: 'decrypt_string',
	EncryptObject: 'encrypt_object',
	DecryptObject: 'decrypt_object',
	CopyEncryptionKey: 'copy_encryption_key',
};

export interface EncryptStringReq {
	payload: string;
	iv: string;
}

export interface DecryptStringReq {
	payload: string;
	iv: string;
}

export interface EncryptObjectReq {
	payload: Record<string, unknown> | unknown[];
	iv: string;
}

export interface DecryptObjectReq {
	payload: string;
	iv: string;
}

export interface SubmitKeyReq {
	key: string;
}

export class IpcEncryptionServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: PartialIpcRenderer) {
		super('encryption', ipc);
	}

	async checkStatus() {
		return this.invoke<boolean>(EncryptionMessages.CheckStatus);
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

	async encryptObject(payload: EncryptObjectReq) {
		return this.invoke<string>(EncryptionMessages.EncryptObject, payload);
	}

	async decryptObject<T>(payload: DecryptObjectReq) {
		return this.invoke<T>(EncryptionMessages.DecryptObject, payload);
	}

	async copyEncryptionKey() {
		return this.invoke(EncryptionMessages.CopyEncryptionKey);
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

	registerEncryptObject(fn: Listener<EncryptObjectReq, string>) {
		this.registerListener(EncryptionMessages.EncryptObject, fn);
	}

	registerDecryptObject(fn: Listener<DecryptObjectReq, unknown>) {
		this.registerListener(EncryptionMessages.DecryptObject, fn);
	}

	registerCopyEncryptionKey(fn: Listener<void, void>) {
		this.registerListener(EncryptionMessages.CopyEncryptionKey, fn);
	}
}
