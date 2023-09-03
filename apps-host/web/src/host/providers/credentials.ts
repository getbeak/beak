import CredentialsProviderBase from '@beak/common-host/providers/credentials';

export default class CredentialsProvider extends CredentialsProviderBase {
	async readFromStore(key: string): Promise<string | null> {
		return localStorage.getItem(key);
	}

	async writeToStore(key: string, value: string): Promise<void> {
		localStorage.setItem(key, value);
	}

	async setBeakAuthEncryptionKey(encryptionKey: string): Promise<void> {
		await this.writeToStore(this.credentialKeys.authEncryptionKey, encryptionKey);
	}

	async getBeakAuthEncryptionKey(): Promise<[string, string] | null> {
		const storedKey = await this.readFromStore(this.credentialKeys.authEncryptionKey);

		if (!storedKey)
			return null;

		const [key, iv] = storedKey.split(':');

		if (key && iv)
			return [key, iv];

		return null;
	}

	async getOrCreateBeakAuthEncryptionKey(key: string, iv: string): Promise<[string, string]> {
		const existingKey = await this.getBeakAuthEncryptionKey();

		if (existingKey) return [existingKey[0], existingKey[1]];

		await this.setBeakAuthEncryptionKey(`${key}:${iv}`);

		return [key, iv];
	}

	async getProjectEncryptionKey(projectId: string): Promise<string | null> {
		const key = [this.credentialKeys.projectEncryptionPrefix, projectId].join('.');

		return await this.readFromStore(key);
	}

	async setProjectEncryptionKey(projectId: string, encryptionKey: string): Promise<void> {
		const key = [this.credentialKeys.projectEncryptionPrefix, projectId].join('.');

		await this.writeToStore(key, encryptionKey);
	}
}
