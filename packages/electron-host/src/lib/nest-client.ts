import { AuthenticateUserResponse } from '@beak/common/types/nest';
import { toWebSafeBase64 } from '@beak/common/utils/base64';
import { makeQueryablePromise, QueryablePromise } from '@beak/common/utils/promises';
import Squawk from '@beak/common/utils/squawk';
import crpc, { Client } from 'crpc';

import persistentStore from './persistent-store';

export interface AuthenticateOptions { }

class NestClient {
	private client: Client;
	private authRefreshPromise?: QueryablePromise<unknown>;

	constructor(baseUrl: string) {
		this.client = crpc(baseUrl);
	}

	getAuth() {
		return persistentStore.get('auth');
	}

	setAuth(auth: AuthenticateUserResponse | null) {
		persistentStore.set('auth', auth);
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

		const state = toWebSafeBase64(randomState);
		const codeVerifier = toWebSafeBase64(randomVerifier);

		const codeVerifierEncoded = encoder.encode(codeVerifier);
		const codeChallengeHash = await crypto.subtle.digest('SHA-256', codeVerifierEncoded);
		const codeChallenge = toWebSafeBase64(new Uint8Array(codeChallengeHash));

		// Create, insert, and store magic states to local storage
		persistentStore.set('magicStates', {
			...persistentStore.get('magicStates'),
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
		const magicStates = persistentStore.get('magicStates');
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

		persistentStore.reset('magicStates');
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
			throw new Squawk('user_not_beta_enrolled');
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

		// This... shouldn't have to be done, but here we are
		await new Promise(resolve => setTimeout(resolve, 1000));
	}
}

function generateOptions(auth: AuthenticateUserResponse | null) {
	if (!auth)
		return void 0;

	return { headers: { authorization: `bearer ${auth.accessToken}` } };
}

const nestClient = new NestClient('https://nest.getbeak.app/1/');

export default nestClient;
