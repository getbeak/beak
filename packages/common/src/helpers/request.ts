import type { RequestBody, RequestBodyType } from '@getbeak/types/request';

// Only HTTP-shaped bodies get a default Content-Type. `json_raw` shares the
// `json` ramp but the editor's literal Content-Type header is the source of
// truth there, and `grpc` is wire-encoded as protobuf at flight time — both
// are intentionally absent so the renderer doesn't grease an HTTP header
// onto an inapplicable body.
const bodyContentTypeMap: Partial<Record<RequestBodyType, string>> = {
	json: 'application/json',
	text: 'text/plain',
	url_encoded_form: 'application/x-www-form-urlencoded',
	file: 'application/octet-stream',
	graphql: 'application/json',
};

export function requestBodyContentType(body: RequestBody): string | undefined {
	if (body.type === 'file' && body.payload.contentType) return body.payload.contentType;
	// Multipart's boundary is minted at flight time — the renderer can't
	// surface a Content-Type header until then. The requester sets the
	// final `multipart/form-data; boundary=…` header itself.
	if (body.type === 'multipart') return undefined;

	return bodyContentTypeMap[body.type];
}
