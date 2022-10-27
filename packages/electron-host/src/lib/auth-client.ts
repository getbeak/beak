import { AuthenticateUserResponse } from '@beak/common/types/nest';

import { decryptString, encryptString } from './aes';
import { getOrCreateBeakAuthEncryptionKey } from './credential-vault';
import logger from './logger';
import persistentStore from './persistent-store';

export default class AuthClient {
	private authEncryptionKey?: string;
	private authEncryptionIv?: string;

	async getAuth(): Promise<AuthenticateUserResponse | null> {
		let auth: string | null = null;

		try {
			const encryptedAuth = persistentStore.get('encryptedAuth');

			if (!encryptedAuth)
				return null;

			const [key, iv] = await this.getAuthEncryption();

			auth = await decryptString(encryptedAuth, key, iv);
		} catch (error) {
			// This happens if the app doesn't have permission to access the secure credential file
			if (error instanceof Error && error.message === 'UNIX[No such file or directory]') {
				logger.warn('auth-client: unable to access credential file', error);

				return null;
			}

			logger.error('auth-client: unable to get authentication credentials', error);

			return null;
		}

		if (!auth)
			return null;

		try {
			return JSON.parse(auth);
		} catch (error) {
			logger.warn('auth-client: parsing auth failed', error);

			return null;
		}
	}

	async setAuth(auth: AuthenticateUserResponse | null): Promise<void> {
		try {
			const [key, iv] = await this.getAuthEncryption();
			const encodedAuth = JSON.stringify(auth);
			const encryptedAuth = await encryptString(encodedAuth, key, iv);

			persistentStore.set('encryptedAuth', encryptedAuth);
		} catch (error) {
			// This happens if the app doesn't have permission to access the secure credential file
			if (error instanceof Error && error.message === 'UNIX[No such file or directory]') {
				logger.warn('auth-client: unable to access credential file', error);

				return;
			}

			logger.error('auth-client: unable to set authentication credentials', error);
		}
	}

	private async getAuthEncryption(): Promise<[string, string]> {
		if (this.authEncryptionKey && this.authEncryptionIv)
			return [this.authEncryptionKey, this.authEncryptionIv];

		const [key, iv] = await getOrCreateBeakAuthEncryptionKey();

		this.authEncryptionKey = key;
		this.authEncryptionIv = iv;

		return [key, iv];
	}
}
