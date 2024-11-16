import { ProjectEncryption } from '@beak/common/types/beak-project';
import CredentialsProviderBase from '@beak/common-host/providers/credentials';
import keytar from 'keytar';
import os from 'os';

export default class CredentialsProvider extends CredentialsProviderBase {
	async readFromStore(key: string): Promise<string | null> {
		return await keytar.getPassword(key, os.userInfo().username);
	}

	async writeToStore(key: string, value: string): Promise<void> {
		await keytar.setPassword(key, os.userInfo().username, value);
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

	async getProjectEncryption(projectId: string): Promise<ProjectEncryption | null> {
		const key = [this.credentialKeys.projectEncryptionPrefix, projectId].join('.');

		const projectEncryptionString = await this.readFromStore(key);

		if (!projectEncryptionString)
			return null;

		// TODO(afr): Validate this
		return JSON.parse(projectEncryptionString);
	}

	async setProjectEncryption(projectId: string, projectEncryption: ProjectEncryption): Promise<void> {
		const key = [this.credentialKeys.projectEncryptionPrefix, projectId].join('.');

		await this.writeToStore(key, JSON.stringify(projectEncryption));
	}
}
