import { MagicState } from '@beak/common/types/nest';
import crpc, { Client } from 'crpc';

interface CrpcOptions {
	headers: Record<string, string>;
}

export default class NestClient {
	private client: Client;

	constructor(baseUrl: string) {
		this.client = crpc(baseUrl);
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
		const decoder = new TextDecoder('utf8');
		const encoder = new TextEncoder();
		const randomState = new Uint8Array(32);
		const randomVerifier = new Uint8Array(32);

		// Generate some Prince Andrews
		crypto.getRandomValues(randomState);
		crypto.getRandomValues(randomVerifier);

		const state = webSafeBase64(decoder.decode(randomState));
		const codeVerifier = webSafeBase64(decoder.decode(randomVerifier));

		const codeVerifierEncoded = encoder.encode(codeVerifier);
		const codeChallengeHash = await crypto.subtle.digest('SHA-256', codeVerifierEncoded);
		const codeChallenge = webSafeBase64(decoder.decode(codeChallengeHash));

		const payload: MagicState = {
			state,
			codeVerifier,
			codeChallenge,
			redirectUri: 'https://magic.getbeak.app/callback',
		};

		await this.rpcNoAuth('2020-12-14/send_magic_link', {
			clientId: 'client_000000C2kdCzNlbL1BqR5FeMatItU',
			redirectUri: 'https://magic.getbeak.app/callback',
			state,
			codeChallengeMethod: 'S256',
			codeChallenge,
			identifierType: 'email',
			identifierValue: email,
		});
	}
}

function webSafeBase64(str: string) {
	const base64 = btoa(str);

	return base64
		.replace(/[+]/g, '-')
		.replace(/[/]/g, '_')
		.replace(/[=]+$/, '');
}

// async function generateAuthorizationState(env) {
// 	const stateData = new Uint8Array(32);
// 	const verifierData = new Uint8Array(32);

// 	window.crypto.getRandomValues(stateData);
// 	window.crypto.getRandomValues(verifierData);

// 	const state = `${toUrlBase64(stateData)}|${env}`;
// 	const verifier = toUrlBase64(verifierData);
// 	const verifierParsedData = new window.TextEncoder('utf-8').encode(verifier);
// 	const challengeData = await window.crypto.subtle.digest('SHA-256', verifierParsedData);

// 	return {
// 		state,
// 		codeVerifier: verifier,
// 		codeChallenge: toUrlBase64(new Uint8Array(challengeData)),
// 	};
// }
