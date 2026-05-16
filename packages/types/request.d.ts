import { EntryMap } from './body-editor-json';
import { ValueSections } from './values';

export interface RequestOverview {
	verb: string;
	url: ValueSections;
	query: Record<string, ToggleKeyValue>;
	headers: Record<string, ToggleKeyValue>;
	body: RequestBody;
	options: RequestOptions;
}

export type RequestBody =
	| RequestBodyText
	| RequestBodyJson
	| RequestBodyJsonRaw
	| RequestBodyUrlEncodedForm
	| RequestBodyFile
	| RequestBodyGraphQl;

export type RequestBodyType = 'text' | 'json' | 'json_raw' | 'url_encoded_form' | 'file' | 'graphql';

export interface RequestBodyText {
	type: 'text';
	payload: string;
}

export interface RequestBodyJson {
	type: 'json';
	payload: EntryMap;
}

/**
 * JSON body authored as a raw string. Equivalent in payload terms to a
 * `text` body, but carries an `application/json` content type by default
 * and renders in a Monaco editor with JSON language highlighting. Pick this
 * when you want full control over the JSON text (and you're fine losing
 * Beak's structured-edit affordances + variable insertion).
 */
export interface RequestBodyJsonRaw {
	type: 'json_raw';
	payload: string;
}

export interface RequestBodyUrlEncodedForm {
	type: 'url_encoded_form';
	payload: Record<string, ToggleKeyValue>;
}

export interface RequestBodyFile {
	type: 'file';
	payload: {
		fileReferenceId?: string;
		contentType?: string;
		__hacky__binaryFileData?: Uint8Array;
		/**
		 * Content-addressed pointer into the project's `_assets/` store. When
		 * present, this is the canonical source of bytes for flight execution;
		 * `fileReferenceId` stays for legacy projects but is read-only.
		 */
		assetRef?: {
			sha256: string;
			size: number;
			contentType?: string;
		};
	};
}

export interface RequestBodyGraphQl {
	type: 'graphql';
	payload: {
		query: string;
		variables: EntryMap;
	};
}

export interface RequestOptions {
	followRedirects: boolean;
	/** When true, the requester accepts gzip/deflate/br and decodes the body. */
	decompressResponse?: boolean;
	/** Request timeout in milliseconds; `0` (default) disables the timeout. */
	timeoutMs?: number;
	/** Cap on redirects followed when `followRedirects` is true. */
	maxRedirects?: number;
}

/**
 * Limited type set for scalar properties (headers, query, url-encoded form).
 * `token` is a UX hint that the editor should mask the value; on the wire
 * it serialises as a plain string.
 */
export type ScalarPropertyType = 'string' | 'number' | 'boolean' | 'enum' | 'token';

export interface ToggleKeyValue {
	name: string;
	value: ValueSections;
	enabled: boolean;
	/** Schema metadata — set in schema mode, ignored at flight time. */
	type?: ScalarPropertyType;
	required?: boolean;
	description?: string;
	/**
	 * For `type === 'enum'`, the allowed values. Value mode renders a select
	 * instead of a free-text input when this list is non-empty.
	 */
	options?: string[];
}
