import type { AssetRef, ResolvedValue } from '@getbeak/extension-sdk';
import type { Context } from '@getbeak/types/values';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('..', () => ({
	VariableManager: {
		getVariable: vi.fn(),
	},
}));

const { VariableManager } = await import('..');
const { resolveValueSections, resolveValuePart } = await import('../resolver');

const getVariable = VariableManager.getVariable as unknown as ReturnType<typeof vi.fn>;

const FAKE_CTX = {} as Context;
const REF: AssetRef = {
	sha256: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
	size: 12,
	contentType: 'image/png',
};

afterEach(() => {
	getVariable.mockReset();
});

/* -------------------------------------------------------------------------- */
/*  Text sink                                                                 */
/* -------------------------------------------------------------------------- */

describe('resolveValueSections — text sink', () => {
	beforeEach(() => getVariable.mockReset());

	it('concatenates literal strings into a single text value', async () => {
		const rv = await resolveValueSections(FAKE_CTX, ['Bearer ', 'token123'], { kind: 'text' });
		expect(rv).toEqual({ kind: 'text', text: 'Bearer token123' });
	});

	it('honours a resolve that returns text', async () => {
		getVariable.mockReturnValueOnce({
			type: 'timestamp',
			sensitive: false,
			resolve: vi.fn(async () => ({ kind: 'text', text: '2026' }) as ResolvedValue),
		});
		const rv = await resolveValueSections(FAKE_CTX, [{ type: 'timestamp', payload: undefined }], { kind: 'text' });
		expect(rv).toEqual({ kind: 'text', text: '2026' });
	});

	it('coerces a bytes producer to UTF-8 text', async () => {
		getVariable.mockReturnValueOnce({
			type: 'inline',
			sensitive: false,
			resolve: vi.fn(async () => ({ kind: 'bytes', bytes: new TextEncoder().encode('hi') }) as ResolvedValue),
		});
		const rv = await resolveValueSections(FAKE_CTX, [{ type: 'inline', payload: undefined }], { kind: 'text' });
		expect(rv).toEqual({ kind: 'text', text: 'hi' });
	});

	it('coerces a stream producer to UTF-8 text', async () => {
		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(new TextEncoder().encode('streamed'));
				controller.close();
			},
		});
		getVariable.mockReturnValueOnce({
			type: 'live',
			sensitive: false,
			resolve: vi.fn(async () => ({ kind: 'stream', stream }) as ResolvedValue),
		});
		const rv = await resolveValueSections(FAKE_CTX, [{ type: 'live', payload: undefined }], { kind: 'text' });
		expect(rv).toEqual({ kind: 'text', text: 'streamed' });
	});

	it('returns "[Recursion detected]" at depth >= 5', async () => {
		getVariable.mockReturnValueOnce({
			type: 'noop',
			sensitive: false,
			resolve: vi.fn(async () => ({ kind: 'text', text: 'never-called' }) as ResolvedValue),
		});
		const rv = await resolveValueSections(FAKE_CTX, [{ type: 'noop', payload: undefined }], { kind: 'text' }, 5);
		expect(rv).toEqual({ kind: 'text', text: '[Recursion detected]' });
	});

	it('returns "[Sensitive mode enabled]" for sensitive variables when opt is set', async () => {
		getVariable.mockReturnValueOnce({
			type: 'private',
			sensitive: true,
			resolve: vi.fn(async () => ({ kind: 'text', text: 'should-be-masked' }) as ResolvedValue),
		});
		const rv = await resolveValueSections(FAKE_CTX, [{ type: 'private', payload: undefined }], { kind: 'text' }, 0, {
			sensitiveMode: true,
		});
		expect(rv).toEqual({ kind: 'text', text: '[Sensitive mode enabled]' });
	});
});

/* -------------------------------------------------------------------------- */
/*  Binary sink                                                               */
/* -------------------------------------------------------------------------- */

describe('resolveValueSections — binary sink', () => {
	beforeEach(() => getVariable.mockReset());

	it('coerces literal text to UTF-8 bytes', async () => {
		const rv = await resolveValueSections(FAKE_CTX, ['hello'], { kind: 'binary' });
		expect(rv.kind).toBe('bytes');
		if (rv.kind === 'bytes') expect(new TextDecoder().decode(rv.bytes)).toBe('hello');
	});

	it('returns the first AssetRef encountered', async () => {
		getVariable.mockReturnValueOnce({
			type: 'fileUpload',
			sensitive: false,
			resolve: vi.fn(async () => ({ kind: 'asset', ref: REF }) as ResolvedValue),
		});
		const rv = await resolveValueSections(FAKE_CTX, [{ type: 'fileUpload', payload: { path: '/x' } }], {
			kind: 'binary',
		});
		expect(rv).toEqual({ kind: 'asset', ref: REF });
	});

	it('drains a stream producer into bytes', async () => {
		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(new Uint8Array([1, 2]));
				controller.enqueue(new Uint8Array([3, 4]));
				controller.close();
			},
		});
		getVariable.mockReturnValueOnce({
			type: 'live',
			sensitive: false,
			resolve: vi.fn(async () => ({ kind: 'stream', stream }) as ResolvedValue),
		});
		const rv = await resolveValueSections(FAKE_CTX, [{ type: 'live', payload: undefined }], { kind: 'binary' });
		expect(rv.kind).toBe('bytes');
		if (rv.kind === 'bytes') expect(Array.from(rv.bytes)).toEqual([1, 2, 3, 4]);
	});

	it('discards preceding literal text when an asset wins', async () => {
		getVariable.mockReturnValueOnce({
			type: 'fileUpload',
			sensitive: false,
			resolve: vi.fn(async () => ({ kind: 'asset', ref: REF }) as ResolvedValue),
		});
		const rv = await resolveValueSections(FAKE_CTX, ['leading-text-', { type: 'fileUpload', payload: {} }], {
			kind: 'binary',
		});
		// Asset hashes wouldn't survive a text prefix; the binary sink
		// docs that preceding text is silently dropped in this case.
		expect(rv).toEqual({ kind: 'asset', ref: REF });
	});

	it('folds preceding literal text into a bytes producer', async () => {
		getVariable.mockReturnValueOnce({
			type: 'inline',
			sensitive: false,
			resolve: vi.fn(async () => ({ kind: 'bytes', bytes: new Uint8Array([0xff, 0xfe]) }) as ResolvedValue),
		});
		const rv = await resolveValueSections(FAKE_CTX, ['prefix:', { type: 'inline', payload: undefined }], {
			kind: 'binary',
		});
		expect(rv.kind).toBe('bytes');
		if (rv.kind === 'bytes') {
			expect(Array.from(rv.bytes)).toEqual([...new TextEncoder().encode('prefix:'), 0xff, 0xfe]);
		}
	});
});

/* -------------------------------------------------------------------------- */
/*  Stream sink                                                               */
/* -------------------------------------------------------------------------- */

describe('resolveValueSections — stream sink', () => {
	beforeEach(() => getVariable.mockReset());

	it('emits a single-chunk stream when all parts are text', async () => {
		const rv = await resolveValueSections(FAKE_CTX, ['just-text'], { kind: 'stream' });
		expect(rv.kind).toBe('stream');
		if (rv.kind === 'stream') {
			const reader = rv.stream.getReader();
			const { value, done } = await reader.read();
			expect(done).toBe(false);
			expect(new TextDecoder().decode(value!)).toBe('just-text');
			expect((await reader.read()).done).toBe(true);
		}
	});

	it('returns the producer stream unchanged when no prefix is needed', async () => {
		const upstream = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(new TextEncoder().encode('chunk-1'));
				controller.close();
			},
		});
		getVariable.mockReturnValueOnce({
			type: 'live',
			sensitive: false,
			resolve: vi.fn(async () => ({ kind: 'stream', stream: upstream, size: 7 }) as ResolvedValue),
		});
		const rv = await resolveValueSections(FAKE_CTX, [{ type: 'live', payload: undefined }], { kind: 'stream' });
		expect(rv.kind).toBe('stream');
		if (rv.kind === 'stream') expect(rv.size).toBe(7);
	});

	it('returns an asset directly without wrapping', async () => {
		getVariable.mockReturnValueOnce({
			type: 'fileUpload',
			sensitive: false,
			resolve: vi.fn(async () => ({ kind: 'asset', ref: REF }) as ResolvedValue),
		});
		const rv = await resolveValueSections(FAKE_CTX, [{ type: 'fileUpload', payload: {} }], { kind: 'stream' });
		expect(rv).toEqual({ kind: 'asset', ref: REF });
	});
});

/* -------------------------------------------------------------------------- */
/*  resolveValuePart helpers                                                  */
/* -------------------------------------------------------------------------- */

describe('resolveValuePart', () => {
	beforeEach(() => getVariable.mockReset());

	it('returns null for an unknown variable type', async () => {
		getVariable.mockReturnValueOnce(undefined);
		const rv = await resolveValuePart(FAKE_CTX, { type: 'missing', payload: {} }, { kind: 'text' }, 0);
		expect(rv).toBeNull();
	});

	it('returns null for sensitive variables in binary sinks during sensitive mode', async () => {
		getVariable.mockReturnValueOnce({
			type: 'private',
			sensitive: true,
			resolve: vi.fn(async () => ({ kind: 'text', text: 'never-called' }) as ResolvedValue),
		});
		const rv = await resolveValuePart(FAKE_CTX, { type: 'private', payload: {} }, { kind: 'binary' }, 0, {
			sensitiveMode: true,
		});
		expect(rv).toBeNull();
	});
});
