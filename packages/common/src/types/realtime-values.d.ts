/* eslint-disable @typescript-eslint/indent */
export type RealtimeValuePart =
	Base64EncodedRtv |
	DigestRtv |
	NonceRtv |
	PrivateRtv |
	SecureRtv |
	TimestampRtv |
	UuidRtv |

	// Special case
	VariableGroupItemRtv;
/* eslint-enable @typescript-eslint/indent */

export interface Base64EncodedRtv {
	type: 'base64_encoded';
	payload: {
		input: string;
		characterSet: 'base64' | 'websafe_base64';
		removePadding: boolean;
	};
}

export interface DigestRtv {
	type: 'digest';
	payload: {
		input: string;
		algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
		hmac?: string;
	};
}

export interface NonceRtv {
	type: 'nonce';
	payload: void;
}

export interface PrivateRtv {
	type: 'private';
	payload: {
		iv: string;
		identifier: string;
	};
}

export interface SecureRtv {
	type: 'secure';
	payload: {
		iv: string;
		datum: string;
	};
}

export interface TimestampRtv {
	type: 'timestamp';
	payload: {
		delta?: number;
		type: string;
	};
}

export interface UuidRtv {
	type: 'uuid';
	payload: {
		version: 'v1' | 'v4';
	};
}

export interface VariableGroupItemRtv {
	type: 'variable_group_item';
	payload: {
		itemId: string;
	};
}
