import { MagicStates } from '@beak/common/types/nest';
import Squawk from '@beak/common/utils/squawk';
import base64 from 'base64-js';
import crpc, { Client } from 'crpc';

import { AuthenticateUserResponse } from '../store/nest/types';
import { makeQueryablePromise, QueryablePromise } from '../utils/promises';
import { LocalStorage } from './local-storage';

const authKey = 'auth';
const magicStatesKey = 'magic-states';

export interface AuthenticateOptions {

}

export default class NestClient {
	private client: Client;
	private storage: LocalStorage;
	private authRefreshPromise?: QueryablePromise<unknown>;

	constructor(baseUrl: string) {
		this.client = crpc(baseUrl);
		this.storage = new LocalStorage('beak.nest-client');
	}

	getAuth(): AuthenticateUserResponse | null {
		return this.storage.getJsonItem<AuthenticateUserResponse>(authKey);
	}

	setAuth(auth: AuthenticateUserResponse | null) {
		this.storage.setJsonItem(authKey, auth);
	}

	async rpc<T>(path: string, body: unknown) {
		const fn = (auth: AuthenticateUserResponse | null) => this.client<T>(path, body, generateOptions(auth));

		try {
			return await fn(this.getAuth());
		} catch (error) {
			if (error.code !== 'unauthorized')
				throw error;

			await this.refresh();

			return await fn(this.getAuth());
		}
	}

	async rpcNoAuth<T>(path: string, body: unknown) {
		return await this.client<T>(path, body);
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

	async handleMagicLink(code: string, state: string) {
		const magicStates = this.storage.getJsonItem<MagicStates>(magicStatesKey) || {};
		const magicState = magicStates[state];

		if (!magicState)
			throw new Squawk('invalid_state');

		const authentication = await this.rpcNoAuth<AuthenticateUserResponse>('2020-12-14/authenticate_user', {
			clientId: 'client_000000C2kdCzNlbL1BqR5FeMatItU',
			grantType: 'authorization_code',
			redirectUri: magicState.redirectUri,
			code,
			codeVerifier: magicState.codeVerifier,
		});

		this.storage.remove(magicStatesKey);
		this.setAuth(authentication);

		await this.ensureAlphaUser();

		return authentication;
	}

	async ensureAlphaUser() {
		const auth = this.getAuth();

		if (!auth)
			throw new Squawk('unauthenticated');

		const response = await this.rpc<{ subscription: string }>('2020-12-14/get_subscription_status', {
			userId: auth.userId,
		});

		if (response.subscription !== 'beak_alpha')
			throw new Squawk('user_not_alpha_enrolled');
	}

	private async refresh() {
		// Check promise exists and that is hasn't been fulfilled
		if (this.authRefreshPromise && this.authRefreshPromise.isPending())
			return await this.authRefreshPromise;

		const promise = makeQueryablePromise(this.authenticate('refresh_token'));

		return await (this.authRefreshPromise = promise);
	}

	private async authenticate(grantType: 'refresh_token') {
		const auth = this.getAuth() ?? { clientId: '', refreshToken: '' };

		const payload = {
			clientId: auth.clientId,
			grantType,
			refreshToken: auth.refreshToken,
		};

		const response = await this.rpcNoAuth<AuthenticateUserResponse>(
			'2020-12-14/authenticate_user',
			payload,
		);

		this.setAuth(response);
	}
}

function webSafeBase64(arr: Uint8Array) {
	return base64
		.fromByteArray(arr)
		.replace(/[+]/g, '-')
		.replace(/[/]/g, '_')
		.replace(/[=]+$/, '');
}

function generateOptions(auth: AuthenticateUserResponse | null) {
	if (!auth)
		return void 0;

	return { headers: { authorization: `bearer ${auth.accessToken}` } };
}
