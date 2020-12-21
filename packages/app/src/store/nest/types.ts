import { AsyncMapState } from '../types';

export const ActionTypes = {
	SEND_MAGIC_LINK: '@beak/global/project/SEND_MAGIC_LINK',
	SEND_MAGIC_LINK_FAILURE: '@beak/global/project/SEND_MAGIC_LINK_FAILURE',
	SEND_MAGIC_LINK_SUCCESS: '@beak/global/project/SEND_MAGIC_LINK_SUCCESS',
};

export interface State {
	sendMagicLink: AsyncMapState<void>;
}

export const initialState: State = {
	sendMagicLink: {},
};

export type GrantType = 'authorization_code' | 'refresh_token' | 'access_token';

export interface Grant {
	type: GrantType;
	value: string;
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
