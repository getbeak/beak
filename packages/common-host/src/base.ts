import type fs from 'node:fs';
import type path from 'node:path';
import type { Logger } from 'tslog';

import CredentialsProvider from './providers/credentials';
import AesProvider from './providers/encryption-aes';
import StorageProvider, { GenericStore } from './providers/storage';

export interface Providers {
	aes: AesProvider;
	credentials: CredentialsProvider;
	logger: Logger<unknown>;
	storage: StorageProvider<GenericStore>;

	node: {
		fs: typeof fs;
		path: typeof path;
	};
}

export class BeakBase {
	readonly providers: Providers;

	get p() {
		return this.providers;
	}

	constructor(providers: Providers) {
		this.providers = providers;
	}
}
