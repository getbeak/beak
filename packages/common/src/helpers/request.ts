import type { RequestBody, RequestBodyType } from '@getbeak/types/request';

const bodyContentTypeMap: Record<RequestBodyType, string> = {
	json: 'application/json',
	text: 'text/plain',
	url_encoded_form: 'application/x-www-form-urlencoded',
	file: 'application/octet-stream',
};

export function requestBodyContentType(body: RequestBody) {
	if (body.type === 'file' && body.payload.contentType)
		return body.payload.contentType;

	return bodyContentTypeMap[body.type];
}
