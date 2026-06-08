import type { FlightBodyMultipart, FlightMultipartPart } from '@beak/common/types/multipart';

import { readProducerToBuffer } from './producer';

const CRLF = '\r\n';

export interface AssembleOptions {
	/** Absolute path to the project root — used to resolve asset producers. */
	projectFolder?: string;
}

/**
 * Assemble a {@link FlightBodyMultipart} into the bytes that go on the
 * wire, returning the Content-Type header value (with boundary) to set
 * alongside it.
 *
 * Binary parts source bytes through {@link readProducerToBuffer}: inline
 * passes through verbatim; asset reads from `_assets/` directly. Stream
 * producers can't go in multipart parts (the assembler needs bytes in
 * hand to interleave with boundary frames); streaming multipart upload
 * needs a different transport.
 */
export async function assembleMultipart(
	body: FlightBodyMultipart,
	opts: AssembleOptions = {},
): Promise<{ bytes: Buffer; contentType: string }> {
	const { boundary, parts } = body.payload;
	const chunks: Buffer[] = [];

	for (const part of parts) {
		chunks.push(Buffer.from(`--${boundary}${CRLF}`));
		chunks.push(buildPartHeaders(part));
		chunks.push(Buffer.from(CRLF));
		chunks.push(await buildPartBody(part, opts));
		chunks.push(Buffer.from(CRLF));
	}
	chunks.push(Buffer.from(`--${boundary}--${CRLF}`));

	return {
		bytes: Buffer.concat(chunks),
		contentType: `multipart/form-data; boundary=${boundary}`,
	};
}

function buildPartHeaders(part: FlightMultipartPart): Buffer {
	const lines: string[] = [];
	const name = sanitiseHeaderValue(part.name);

	if (part.kind === 'text') {
		const contentType = sanitiseHeaderValue(part.contentType ?? 'text/plain; charset=utf-8');
		lines.push(`Content-Disposition: form-data; name="${escapeQuoted(name)}"`);
		lines.push(`Content-Type: ${contentType}`);
	} else {
		const filename = sanitiseHeaderValue(part.filename ?? '');
		const contentType = sanitiseHeaderValue(part.contentType ?? 'application/octet-stream');
		lines.push(
			filename
				? `Content-Disposition: form-data; name="${escapeQuoted(name)}"; filename="${escapeQuoted(filename)}"`
				: `Content-Disposition: form-data; name="${escapeQuoted(name)}"`,
		);
		lines.push(`Content-Type: ${contentType}`);
	}

	return Buffer.from(lines.join(CRLF) + CRLF);
}

async function buildPartBody(part: FlightMultipartPart, opts: AssembleOptions): Promise<Buffer> {
	if (part.kind === 'text') return Buffer.from(part.value, 'utf-8');
	return await readProducerToBuffer(part.source, opts.projectFolder);
}

function escapeQuoted(value: string): string {
	// RFC 7578 says backslash-escape quotes and backslashes in the quoted
	// string. The vast majority of servers accept the simpler
	// percent-encoding for non-ASCII names; we stick to backslash escaping
	// for ASCII and pass UTF-8 bytes through for everything else (matches
	// curl's behaviour).
	return value.replace(/(["\\])/g, '\\$1');
}

/**
 * Strip CR/LF from any header-context string. A part name, filename, or
 * content-type carrying `\r\n` would terminate the current header and
 * smuggle arbitrary headers into the request (HTTP response splitting,
 * applied to multipart). Strip rather than reject so a stray newline
 * doesn't fail the whole request — the user-visible name is still
 * recognisable; the wire is well-formed.
 */
function sanitiseHeaderValue(value: string): string {
	return value.replace(/[\r\n]/g, '');
}
