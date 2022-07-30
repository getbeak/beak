export type GrantType = 'authorization_code' | 'refresh_token' | 'access_token';
export type CancelType = 'immediate' | 'period_end';

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
	device: {
		platform: 'mac' | 'windows' | 'linux';
		beakId: string;
		fingerprint: string;
	};
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
	status: string;
	billingPortalUrl: string | null;
	startDate: string;
	endDate: string | null;
	cancelAt: string | null;
	cancelType: CancelType | null;
	cancelledAt: string | null;
}

export interface GetMarketingConsentResponse {
	level: 'none' | 'general';
}

export interface SetMarketingConsentRequest {
	userId: string;
	level: 'none' | 'general';
}

export interface GetUserRequest {
	userId: string;
}

export interface GetUserResponse {
	id: string;
	createdAt: string;
	identifiers: {
		id: string;
		identifierType: string;
		identifierValue: string;
		createdAt: string;
		updatedAt: string | null;
		verifiedAt: string | null;
		removedAt: string | null;
	}[];
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
