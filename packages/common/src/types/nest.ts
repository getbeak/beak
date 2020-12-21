export interface MagicStates {
	[state: string]: MagicState;
}

export interface MagicState {
	state: string;
	codeVerifier: string;
	codeChallenge: string;
	redirectUri: string;
}
