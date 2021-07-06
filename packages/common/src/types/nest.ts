export type GrantType = 'authorization_code' | 'refresh_token' | 'access_token';

export interface MagicStates {
	[state: string]: MagicState;
}

export interface MagicState {
	state: string;
	codeVerifier: string;
	codeChallenge: string;
	redirectUri: string;
}

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

export interface ListNewsItemsRequest {
	clientId: string;
}

export interface NewsItem {
	id: string;
	primary: NewsItemType;
	fallback: null | NewsItemType;
}

export type NewsItemType = NewsItemGenericBanner;

export interface NewsItemGenericBanner {
	code: 'generic_banner';
	dismissible: boolean;
	payload: {
		emoji: string;
		title: string;
		body: string;
		action: {
			url: string;
			cta: string;
		} | null;
	};
}
