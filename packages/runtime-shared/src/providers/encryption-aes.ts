const aesAlgo = 'aes-256-ctr'; // 256 bit counter, very nice :borat:

export default abstract class AesProvider {
	readonly aesAlgo: string = aesAlgo;
	readonly algorithmVersionMap: Record<string, typeof aesAlgo> = {
		'2020-01-25': aesAlgo,
	};

	abstract generateKey(): Promise<string>;
	abstract generateIv(): Promise<string>;

	abstract encrypt(payload: Uint8Array, key: string, iv: string): Promise<string>;
	abstract decrypt(payload: Uint8Array, key: string, iv: string): Promise<string>;

	abstract encryptString(payload: string, key: string, iv: string): Promise<string>;
	abstract decryptString(payload: string, key: string, iv: string): Promise<string>;
}
