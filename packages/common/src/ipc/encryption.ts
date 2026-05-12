import { z } from 'zod';
import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

// Inbound payload schemas — guard renderer→main encryption requests.
const encryptStringSchema = z.object({
	iv: z.string().min(1),
	payload: z.string(),
});
const decryptStringSchema = encryptStringSchema; // same shape
const encryptObjectSchema = z.object({
	iv: z.string().min(1),
	payload: z.union([z.record(z.string(), z.unknown()), z.array(z.unknown())]),
});
const decryptObjectSchema = z.object({
	iv: z.string().min(1),
	payload: z.string(),
});
const submitKeySchema = z.object({ key: z.string().min(1) });

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

export class IpcEncryptionServiceRenderer extends IpcServiceRenderer<'encryption'> {
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

export class IpcEncryptionServiceMain extends IpcServiceMain<'encryption'> {
	constructor(ipc: PartialIpcMain) {
		super('encryption', ipc);
	}

	registerCheckStatus(fn: IpcListener<void>) {
		this.registerRequestHandler(EncryptionMessages.CheckStatus, fn);
	}

	registerSubmitKey(fn: IpcListener<SubmitKeyReq>) {
		this.registerRequestHandler(EncryptionMessages.SubmitKey, fn, submitKeySchema as never);
	}

	registerGenerateIv(fn: IpcListener<void>) {
		this.registerRequestHandler(EncryptionMessages.GenerateIv, fn);
	}

	registerEncryptString(fn: IpcListener<EncryptStringReq>) {
		this.registerRequestHandler(EncryptionMessages.EncryptString, fn, encryptStringSchema as never);
	}

	registerDecryptString(fn: IpcListener<DecryptStringReq>) {
		this.registerRequestHandler(EncryptionMessages.DecryptString, fn, decryptStringSchema as never);
	}

	registerEncryptObject(fn: IpcListener<EncryptObjectReq>) {
		this.registerRequestHandler(EncryptionMessages.EncryptObject, fn, encryptObjectSchema as never);
	}

	registerDecryptObject(fn: IpcListener<DecryptObjectReq>) {
		this.registerRequestHandler(EncryptionMessages.DecryptObject, fn, decryptObjectSchema as never);
	}

	registerCopyEncryptionKey(fn: IpcListener<void>) {
		this.registerRequestHandler(EncryptionMessages.CopyEncryptionKey, fn);
	}
}
