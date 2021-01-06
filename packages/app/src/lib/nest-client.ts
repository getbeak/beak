import { MagicStates } from '@beak/common/types/nest';
import base64 from 'base64-js';
import crpc, { Client } from 'crpc';

import { LocalStorage } from './local-storage';

const magicStatesKey = 'magic-states';

interface CrpcOptions {
	headers: Record<string, string>;
}

export default class NestClient {
	private client: Client;
	private storage: LocalStorage;

	constructor(baseUrl: string) {
		this.client = crpc(baseUrl);
		this.storage = new LocalStorage('beak.nest-client');
	}

	async rpc<T>(path: string, body: unknown, options?: CrpcOptions) {
		return await this.client<T>(path, body, {
			...options,
			headers: {
				...options?.headers,
				// TODO(afr): Add JWT
				authorization: 'bearer x',
			},
		});
	}

	async rpcNoAuth<T>(path: string, body: unknown, options?: CrpcOptions) {
		return await this.client<T>(path, body, options);
	}

	async sendMagicLink(email: string) {
		const encoder = new TextEncoder();
		const randomState = new Uint8Array(32);
		const randomVerifier = new Uint8Array(32);

		// Generate some Prince Andrews
		crypto.getRandomValues(randomState);
		crypto.getRandomValues(randomVerifier);

		const state = webSafeBase64(randomState);
		const codeVerifier = webSafeBase64(randomVerifier);

		const codeVerifierEncoded = encoder.encode(codeVerifier);
		const codeChallengeHash = await crypto.subtle.digest('SHA-256', codeVerifierEncoded);
		const codeChallenge = webSafeBase64(new Uint8Array(codeChallengeHash));

		// Create, insert, and store magic states to local storage
		this.storage.setJsonItem(magicStatesKey, {
			...(this.storage.getJsonItem<MagicStates>(magicStatesKey) || {}),
			[state]: {
				state,
				codeVerifier,
				codeChallenge,
				redirectUri: 'https://magic.getbeak.app/',
			},
		});

		await this.rpcNoAuth('2020-12-14/send_magic_link', {
			clientId: 'client_000000C2kdCzNlbL1BqR5FeMatItU',
			redirectUri: 'https://magic.getbeak.app/',
			state,
			codeChallengeMethod: 'S256',
			codeChallenge,
			identifierType: 'email',
			identifierValue: email,
		});
	}
}

function webSafeBase64(arr: Uint8Array) {
	return base64
		.fromByteArray(arr)
		.replace(/[+]/g, '-')
		.replace(/[/]/g, '_')
		.replace(/[=]+$/, '');
}
