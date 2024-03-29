import type { ValuePart as GenericValuePart } from '@getbeak/types/values';

export type ValuePart = GenericValuePart;
export type ValueParts = ValuePart[];

export interface Base64DecodedRtv {
	input: ValueParts;
	characterSet: 'base64' | 'websafe_base64';
}

export interface Base64EncodedRtv {
	input: ValueParts;
	characterSet: 'base64' | 'websafe_base64';
	removePadding: boolean;
}

export interface DigestRtv {
	input: ValueParts;
	algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' | 'MD5';
	hmac?: string;
}

export interface PrivateRtv {
	iv: string;
	identifier: string;
}

export interface RequestHeaderRtv {
	headerName: ValueParts;
}

export interface ResponseBodyJsonRtv {
	requestId: string;
	dotPath: ValueParts;
}

export interface ResponseBodyTextRtv {
	requestId: string;
}

export interface ResponseHeaderRtv {
	requestId: string;
	headerName: ValueParts;
}

export interface ResponseStatusCodeRtv {
	requestId: string;
}

export interface SecureRtv {
	iv: string;
	cipherText: string;

	/** @deprecated use cipherText now */
	datum?: string;
}

export interface TimestampRtv {
	delta?: number;
	type: string;
}

export interface UuidRtv {
	version: 'v1' | 'v4';
}

export interface VariableGroupItemRtv {
	itemId: string;
}
