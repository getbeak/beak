import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { ValueProducerHandle } from '@beak/common/types/value-producers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { openAssetStreamOrBuffer, readProducerToBuffer } from '../producer';

const VALID_SHA = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';

let projectFolder: string;

beforeEach(async () => {
	projectFolder = await fs.mkdtemp(path.join(os.tmpdir(), 'beak-producer-test-'));
});

afterEach(async () => {
	await fs.rm(projectFolder, { recursive: true, force: true });
});

describe('readProducerToBuffer', () => {
	it('returns inline bytes verbatim', async () => {
		const producer: ValueProducerHandle = { kind: 'inline', bytes: new Uint8Array([1, 2, 3]) };
		const buf = await readProducerToBuffer(producer, undefined);
		expect(buf.equals(Buffer.from([1, 2, 3]))).toBe(true);
	});

	it('reads asset bytes from the project _assets store', async () => {
		const dir = path.join(projectFolder, '_assets', VALID_SHA.slice(0, 2));
		await fs.mkdir(dir, { recursive: true });
		await fs.writeFile(path.join(dir, VALID_SHA), Buffer.from('hello world'));

		const producer: ValueProducerHandle = { kind: 'asset', ref: { sha256: VALID_SHA, size: 11 } };
		const buf = await readProducerToBuffer(producer, projectFolder);
		expect(buf.toString('utf-8')).toBe('hello world');
	});

	it('rejects asset sha256 that does not match the canonical hex pattern', async () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const producer: ValueProducerHandle = { kind: 'asset', ref: { sha256: '../../etc/passwd', size: 0 } };
		const buf = await readProducerToBuffer(producer, projectFolder);
		expect(buf.byteLength).toBe(0);
		expect(spy).toHaveBeenCalled();
		spy.mockRestore();
	});

	it('returns empty buffer when projectFolder is missing for asset producers', async () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const producer: ValueProducerHandle = { kind: 'asset', ref: { sha256: VALID_SHA, size: 0 } };
		const buf = await readProducerToBuffer(producer, undefined);
		expect(buf.byteLength).toBe(0);
		spy.mockRestore();
	});

	it('throws on stream producers (use streamProducerToReadable instead)', async () => {
		const producer: ValueProducerHandle = { kind: 'stream', streamId: 'sid' };
		await expect(readProducerToBuffer(producer, projectFolder)).rejects.toThrow(/streamProducerToReadable/);
	});
});

describe('openAssetStreamOrBuffer', () => {
	it('returns a ReadStream for an asset with valid sha256', async () => {
		const dir = path.join(projectFolder, '_assets', VALID_SHA.slice(0, 2));
		await fs.mkdir(dir, { recursive: true });
		await fs.writeFile(path.join(dir, VALID_SHA), Buffer.from('stream-me'));

		const producer: ValueProducerHandle = { kind: 'asset', ref: { sha256: VALID_SHA, size: 9 } };
		const out = await openAssetStreamOrBuffer(producer, projectFolder);
		expect(out).not.toBeInstanceOf(Buffer);

		const chunks: Buffer[] = [];
		for await (const chunk of out as NodeJS.ReadableStream) chunks.push(chunk as Buffer);
		expect(Buffer.concat(chunks).toString('utf-8')).toBe('stream-me');
	});

	it('falls back to buffer for inline producers', async () => {
		const producer: ValueProducerHandle = { kind: 'inline', bytes: new Uint8Array([7, 8, 9]) };
		const out = await openAssetStreamOrBuffer(producer, projectFolder);
		expect(out).toBeInstanceOf(Buffer);
		expect((out as Buffer).equals(Buffer.from([7, 8, 9]))).toBe(true);
	});
});
