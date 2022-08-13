import { EntryMap } from './body-editor-json';
import { ValueParts } from './values';

export interface RequestOverview {
	verb: string;
	url: ValueParts;
	query: Record<string, ToggleKeyValue>;
	headers: Record<string, ToggleKeyValue>;
	body: RequestBody;
	options: RequestOptions;
}

export type RequestBody = RequestBodyText | RequestBodyJson | RequestBodyUrlEncodedForm | RequestBodyFile;
export type RequestBodyType = 'text' | 'json' | 'url_encoded_form' | 'file';

export interface RequestBodyText {
	type: 'text';
	payload: string;
}

export interface RequestBodyJson {
	type: 'json';
	payload: EntryMap;
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
	};
}

export interface RequestOptions {
	followRedirects: boolean;
}

export interface ToggleKeyValue {
	name: string;
	value: ValueParts;
	enabled: boolean;
}
