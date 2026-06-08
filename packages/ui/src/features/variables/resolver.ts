import type { ResolvedValue, Sink } from '@getbeak/extension-sdk';
import type { Context, ValueSections } from '@getbeak/types/values';

import { VariableManager } from '.';

/**
 * RTV resolver — the single entry point for value-section resolution
 * declared in ADR-0007 § "ResolvedValue + Sink matching". Walks the
 * sections, calls each variable's `resolve`, then coerces the producer
 * kind to the consumer's {@link Sink} via a fixed table.
 */

const RECURSION_LIMIT = 5;
const RTV_TIMEOUT_MS = 600;

export interface ResolveOptions {
	/** When true, sensitive variables short-circuit to a placeholder string. */
	sensitiveMode?: boolean;
}

/**
 * Resolve a `ValueSections` array against a consumer sink. Returns a
 * single {@link ResolvedValue}:
 *
 * - `text` sink → `{ kind: 'text', text }` with parts concatenated.
 * - `binary` sink → the first part that produces non-text content wins
 *   (binary sinks accept one blob); preceding text is folded in via a
 *   UTF-8-encoded prefix; if no binary part appears, the whole thing
 *   collapses to a UTF-8-encoded text payload.
 * - `stream` sink → same single-value rule as binary, stream-typed.
 */
export async function resolveValueSections(
	ctx: Context,
	parts: ValueSections,
	sink: Sink,
	depth = 0,
	opts: ResolveOptions = {},
): Promise<ResolvedValue> {
	switch (sink.kind) {
		case 'text':
			return await resolveAsText(ctx, parts, depth, opts);
		case 'binary':
			return await resolveAsBinary(ctx, parts, depth, opts);
		case 'stream':
			return await resolveAsStream(ctx, parts, depth, opts);
	}
}

async function resolveAsText(
	ctx: Context,
	parts: ValueSections,
	depth: number,
	opts: ResolveOptions,
): Promise<ResolvedValue> {
	const pieces = await Promise.all(
		parts.map(async part => {
			if (typeof part === 'string') return part;
			if (typeof part !== 'object' || part === null) return '';
			const rv = await resolveValuePart(ctx, part, { kind: 'text' }, depth, opts);
			if (rv === null) return '';
			return await coerceToString(rv);
		}),
	);
	return { kind: 'text', text: pieces.join('') };
}

async function resolveAsBinary(
	ctx: Context,
	parts: ValueSections,
	depth: number,
	opts: ResolveOptions,
): Promise<ResolvedValue> {
	let prefix = '';
	for (const part of parts) {
		if (typeof part === 'string') {
			prefix += part;
			continue;
		}
		if (typeof part !== 'object' || part === null) continue;

		const rv = await resolveValuePart(ctx, part, { kind: 'binary' }, depth, opts);
		if (rv === null) continue;

		if (rv.kind === 'text') {
			prefix += rv.text;
			continue;
		}
		if (rv.kind === 'bytes') return prefixedBytes(prefix, rv.bytes, rv.contentType);
		if (rv.kind === 'asset') {
			// Asset wins. Preceding literal text is discarded: binary sinks
			// (a file body, a multipart binary part) are single-value by
			// definition, and folding text into a content-addressed asset
			// would change its hash. Callers that need text prepended should
			// use bytes, not assets.
			return rv;
		}
		if (rv.kind === 'stream') {
			const bytes = await drainStream(rv.stream);
			return prefixedBytes(prefix, bytes, rv.contentType);
		}
	}
	return { kind: 'bytes', bytes: new TextEncoder().encode(prefix) };
}

async function resolveAsStream(
	ctx: Context,
	parts: ValueSections,
	depth: number,
	opts: ResolveOptions,
): Promise<ResolvedValue> {
	let prefix = '';
	for (const part of parts) {
		if (typeof part === 'string') {
			prefix += part;
			continue;
		}
		if (typeof part !== 'object' || part === null) continue;

		const rv = await resolveValuePart(ctx, part, { kind: 'stream' }, depth, opts);
		if (rv === null) continue;

		if (rv.kind === 'text') {
			prefix += rv.text;
			continue;
		}
		if (rv.kind === 'stream') return prefixedStream(prefix, rv.stream, rv.size, rv.contentType);
		if (rv.kind === 'bytes')
			return prefixedStream(prefix, singleChunkStream(rv.bytes), rv.bytes.byteLength, rv.contentType);
		if (rv.kind === 'asset') return rv;
	}
	const bytes = new TextEncoder().encode(prefix);
	return { kind: 'stream', stream: singleChunkStream(bytes), size: bytes.byteLength };
}

/* -------------------------------------------------------------------------- */
/*  Per-part resolution                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Resolve a single value part against a sink, applying recursion / timeout /
 * sensitive-mode guards. Returns `null` when the part can't resolve
 * (missing variable, recursion limit, sensitive in sensitive mode, error).
 */
export async function resolveValuePart(
	ctx: Context,
	part: ValueSections[number],
	sink: Sink,
	depth: number,
	opts: ResolveOptions = {},
): Promise<ResolvedValue | null> {
	if (typeof part === 'string') return { kind: 'text', text: part };
	if (typeof part !== 'object' || part === null) return null;
	if (depth >= RECURSION_LIMIT) {
		return sink.kind === 'text' ? { kind: 'text', text: '[Recursion detected]' } : null;
	}

	const rtv = VariableManager.getVariable(part.type);
	if (!rtv) return null;

	if (opts.sensitiveMode && rtv.sensitive) {
		return sink.kind === 'text' ? { kind: 'text', text: '[Sensitive mode enabled]' } : null;
	}

	const settled = { done: false };
	try {
		const winner = await Promise.race([
			rtv.resolve({ variableContext: ctx, sink, depth: depth + 1 }, part.payload).then(rv => {
				settled.done = true;
				return rv;
			}),
			rtvTimeout(rtv.type, settled),
		]);
		return winner;
	} catch {
		settled.done = true;
		console.error(`Failed to resolve value from ${rtv.type}`);
		return null;
	}
}

/* -------------------------------------------------------------------------- */
/*  Coercion helpers                                                          */
/* -------------------------------------------------------------------------- */

async function coerceToString(rv: ResolvedValue): Promise<string> {
	switch (rv.kind) {
		case 'text':
			return rv.text;
		case 'bytes':
			return new TextDecoder().decode(rv.bytes);
		case 'stream': {
			const bytes = await drainStream(rv.stream);
			return new TextDecoder().decode(bytes);
		}
		case 'asset':
			// Reading an asset for a text sink is a user error per ADR-0007.
			// We don't have an IPC handle here to fetch the bytes — that
			// lives in the caller's service layer. Render the sha prefix
			// so the preview shows something instead of silently emptying.
			return `[asset ${rv.ref.sha256.slice(0, 8)}]`;
	}
}

async function drainStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
	const reader = stream.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	try {
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			chunks.push(value);
			total += value.byteLength;
		}
	} finally {
		reader.releaseLock();
	}
	const out = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		out.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return out;
}

function singleChunkStream(bytes: Uint8Array): ReadableStream<Uint8Array> {
	return new ReadableStream<Uint8Array>({
		start(controller) {
			if (bytes.byteLength > 0) controller.enqueue(bytes);
			controller.close();
		},
	});
}

function prefixedBytes(prefix: string, bytes: Uint8Array, contentType?: string): ResolvedValue {
	if (prefix.length === 0) return { kind: 'bytes', bytes, contentType };
	const head = new TextEncoder().encode(prefix);
	const out = new Uint8Array(head.byteLength + bytes.byteLength);
	out.set(head, 0);
	out.set(bytes, head.byteLength);
	return { kind: 'bytes', bytes: out, contentType };
}

function prefixedStream(
	prefix: string,
	stream: ReadableStream<Uint8Array>,
	size: number | undefined,
	contentType: string | undefined,
): ResolvedValue {
	if (prefix.length === 0) return { kind: 'stream', stream, size, contentType };
	const head = new TextEncoder().encode(prefix);
	const reader = stream.getReader();
	let emittedPrefix = false;
	const composed = new ReadableStream<Uint8Array>({
		async pull(controller) {
			if (!emittedPrefix) {
				controller.enqueue(head);
				emittedPrefix = true;
				return;
			}
			const { value, done } = await reader.read();
			if (done) {
				controller.close();
				return;
			}
			controller.enqueue(value);
		},
		cancel(reason) {
			void reader.cancel(reason);
		},
	});
	const composedSize = typeof size === 'number' ? size + head.byteLength : undefined;
	return { kind: 'stream', stream: composed, size: composedSize, contentType };
}

/* -------------------------------------------------------------------------- */
/*  Timeout                                                                   */
/* -------------------------------------------------------------------------- */

function rtvTimeout(rtvType: string, settled: { done: boolean }): Promise<ResolvedValue | null> {
	return new Promise(resolve => {
		window.setTimeout(() => {
			if (!settled.done) console.error(`Fetching value for ${rtvType} exceeded ${RTV_TIMEOUT_MS}ms`);
			resolve(null);
		}, RTV_TIMEOUT_MS);
	});
}
