import { IpcMain, IpcRenderer } from 'electron';

import { AsyncListener, IpcServiceMain, IpcServiceRenderer } from './ipc';

export const EncryptionMessages = {
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

export class IpcEncryptionServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: IpcRenderer) {
		super('encryption', ipc);
	}

	async generateIv(): Promise<string> {
		return this.ipc.invoke(this.channel, { code: EncryptionMessages.GenerateIv });
	}

	async encryptString(payload: EncryptStringReq): Promise<string> {
		return this.ipc.invoke(this.channel, {
			code: EncryptionMessages.EncryptString,
			payload,
		});
	}

	async decryptString(payload: DecryptStringReq): Promise<string> {
		return this.ipc.invoke(this.channel, {
			code: EncryptionMessages.DecryptString,
			payload,
		});
	}
}

export class IpcEncryptionServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('encryption', ipc);
	}

	registerGenerateIv(fn: AsyncListener<void, string>) {
		this.registerListener(EncryptionMessages.GenerateIv, fn);
	}

	registerEncryptString(fn: AsyncListener<EncryptStringReq, string>) {
		this.registerListener(EncryptionMessages.EncryptString, fn);
	}

	registerDecryptString(fn: AsyncListener<DecryptStringReq, string>) {
		this.registerListener(EncryptionMessages.DecryptString, fn);
	}
}
