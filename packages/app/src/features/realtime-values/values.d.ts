import type { ValuePart as GenericValuePart } from '@getbeak/types/values';

export type ValuePart = GenericValuePart | RealtimeValuePart;
export type ValueParts = ValuePart[];

/* eslint-disable @typescript-eslint/indent */
export type RealtimeValuePart =
	Base64EncodedRtv |
	CharacterCarriageReturn |
	CharacterNewline |
	CharacterTab |
	DigestRtv |
	NonceRtv |
	PrivateRtv |
	RequestHeaderRtv |
	RequestFolderRtv |
	RequestMethodRtv |
	RequestNameRtv |
	ResponseBodyJsonRtv |
	ResponseBodyTextRtv |
	ResponseHeaderRtv |
	ResponseStatusCodeRtv |
	SecureRtv |
	TimestampRtv |
	UuidRtv |

	// Special case
	VariableGroupItemRtv;
/* eslint-enable @typescript-eslint/indent */

export interface Base64EncodedRtv {
	type: 'base64_encoded';
	payload: {
		input: ValueParts;
		characterSet: 'base64' | 'websafe_base64';
		removePadding: boolean;
	};
}

export interface CharacterCarriageReturn { type: 'character_carriage_return'; payload: void }
export interface CharacterNewline { type: 'character_newline'; payload: void }
export interface CharacterTab { type: 'character_tab'; payload: void }

export interface DigestRtv {
	type: 'digest';
	payload: {
		input: ValueParts;
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

export interface RequestHeaderRtv {
	type: 'request_header';
	payload: {
		headerName: ValueParts;
	};
}

export interface RequestFolderRtv {
	type: 'request_folder';
	payload: void;
}

export interface RequestMethodRtv {
	type: 'request_method';
	payload: void;
}

export interface RequestNameRtv {
	type: 'request_name';
	payload: void;
}

export interface ResponseBodyJsonRtv {
	type: 'response_body_json';
	payload: {
		requestId: string;
		dotPath: ValueParts;
	};
}

export interface ResponseBodyTextRtv {
	type: 'response_body_text';
	payload: {
		requestId: string;
	};
}

export interface ResponseHeaderRtv {
	type: 'response_header';
	payload: {
		requestId: string;
		headerName: ValueParts;
	};
}

export interface ResponseStatusCodeRtv {
	type: 'response_status_code';
	payload: {
		requestId: string;
	};
}

export interface SecureRtv {
	type: 'secure';
	payload: {
		iv: string;
		cipherText: string;

		/** @deprecated use cipherText now */
		datum?: string;
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