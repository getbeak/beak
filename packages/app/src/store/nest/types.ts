import { AsyncState, createInitialAsyncState } from '../types';

export const ActionTypes = {
	HANDLE_MAGIC_LINK: '@beak/global/nest/HANDLE_MAGIC_LINK',
	SEND_MAGIC_LINK: '@beak/global/nest/SEND_MAGIC_LINK',
};

export interface State {
	handleMagicLink: AsyncState<void>;
	sendMagicLink: AsyncState<void>;
}

export const initialState: State = {
	handleMagicLink: createInitialAsyncState(),
	sendMagicLink: createInitialAsyncState(),
};

export type GrantType = 'authorization_code' | 'refresh_token' | 'access_token';

export interface Grant {
	type: GrantType;
	value: string;
}

export interface SendMagicLinkPayload {
	email: string;
}

export interface HandleMagicLinkPayload {
	code: string;
	state: string;
}

export interface SendMagicLinkRequest {
	clientId: string;
	redirectUri: string;
	state: string;
	codeChallengeMethod: string;
	codeChallenge: string;
	identifierType: string;
	identifierValue: string;
}

export interface AuthenticateUserRequest {
	clientId: string;
	grantType: GrantType;
	redirectUri?: string;
	code: string;
	codeVerifier?: string;
}

export interface AuthenticateUserResponse {
	accessToken: string;
	tokenType: string;
	expiresIn: number;
	expiresAt: string;
	refreshToken: string;
	userId: string;
	clientId: string;
}

export interface GetSubscriptionStatusRequest {
	userId: string;
}

export interface GetSubscriptionStatusResponse {
	subscription: string;
}

export default {
	ActionTypes,
	initialState,
};
