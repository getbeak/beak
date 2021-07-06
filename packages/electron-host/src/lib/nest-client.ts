import { AuthenticateUserResponse, NewsItem } from '@beak/common/types/nest';
import QueryablePromise from '@beak/common/utils/promises';
import Squawk from '@beak/common/utils/squawk';
import crpc, { Client } from 'crpc';
import crypto from 'crypto';

import persistentStore from './persistent-store';

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
		const randomState = crypto.randomBytes(32);
		const randomVerifier = crypto.randomBytes(32);

		const state = convertToWebSafe(randomState.toString('base64'));
		const codeVerifier = convertToWebSafe(randomVerifier.toString('base64'));

		// Hash the code verifier, then make it web-safe base64
		const codeChallengeHash = crypto.createHash('sha256')
			.update(codeVerifier, 'ascii')
			.digest('base64');

		const codeChallenge = convertToWebSafe(codeChallengeHash);

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

		try {
			await this.rpcNoAuth('2020-12-14/send_magic_link', {
				clientId: getClientId(),
				redirectUri: 'https://magic.getbeak.app/',
				state,
				codeChallengeMethod: 'S256',
				codeChallenge,
				identifierType: 'email',
				identifierValue: email,
			});
		} catch (error) {
			const squawk = Squawk.coerce(error);
			const message = (squawk.meta?.message ?? '') as string;

			if (['Missing final \'@domain\'', 'Domain starts with dot'].includes(message))
				throw new Squawk('invalid_email', void 0, [squawk]);

			throw error;
		}
	}

	async handleMagicLink(code: string, state: string) {
		const magicStates = persistentStore.get('magicStates');
		const magicState = magicStates[state];

		if (!magicState)
			throw new Squawk('invalid_state');

		const authentication = await this.rpcNoAuth<AuthenticateUserResponse>('2020-12-14/authenticate_user', {
			clientId: getClientId(),
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
		if (this.authRefreshPromise && this.authRefreshPromise.status === 'pending')
			return await this.authRefreshPromise;

		const promise = new QueryablePromise<void>((_resolve, reject) => {
			this.authenticate('refresh_token').catch(reject);
		});

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

	async listNewsItems(clientId?: string) {
		return await this.rpc<NewsItem[]>('2020-12-14/list_news_items', {
			clientId: clientId ?? getClientId(),
		});
	}
}

function getClientId() {
	switch (process.platform) {
		case 'darwin':
			return 'client_000000C2kdCzNlbL1BqR5FeMatItU';

		case 'win32':
			return 'client_000000CAixkP7YVb0cH1zvNfE5mYi';

		case 'linux':
		default:
			return 'client_000000CAixjPMTECPznenOM8rKRxQ';
	}
}

function generateOptions(auth: AuthenticateUserResponse | null) {
	if (!auth)
		return void 0;

	return { headers: { authorization: `bearer ${auth.accessToken}` } };
}

function convertToWebSafe(str: string) {
	return str
		.replace(/[+]/g, '-')
		.replace(/[/]/g, '_')
		.replace(/[=]+$/, '');
}

const nestClient = new NestClient('https://nest.getbeak.app/1/');

export default nestClient;
