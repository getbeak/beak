import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { FlightBodyMultipart } from '@beak/common/types/multipart';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { assembleMultipart } from '../multipart';

const SHA = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';

let projectFolder: string;

beforeEach(async () => {
	projectFolder = await fs.mkdtemp(path.join(os.tmpdir(), 'beak-multipart-test-'));
});

afterEach(async () => {
	await fs.rm(projectFolder, { recursive: true, force: true });
});

describe('assembleMultipart', () => {
	it('emits a wire-correct multipart body with text + inline binary parts', async () => {
		const body: FlightBodyMultipart = {
			type: 'multipart',
			payload: {
				boundary: 'TESTBOUND',
				parts: [
					{ kind: 'text', name: 'username', value: 'alice' },
					{
						kind: 'binary',
						name: 'avatar',
						filename: 'a.png',
						contentType: 'image/png',
						source: { kind: 'inline', bytes: new Uint8Array([0xff, 0xfe]) },
					},
				],
			},
		};

		const { bytes, contentType } = await assembleMultipart(body);

		expect(contentType).toBe('multipart/form-data; boundary=TESTBOUND');

		const wire = bytes.toString('binary');
		expect(wire).toContain('--TESTBOUND\r\n');
		expect(wire).toContain('Content-Disposition: form-data; name="username"\r\n');
		expect(wire).toContain('Content-Type: text/plain; charset=utf-8\r\n');
		expect(wire).toContain('\r\nalice\r\n');
		expect(wire).toContain('Content-Disposition: form-data; name="avatar"; filename="a.png"\r\n');
		expect(wire).toContain('Content-Type: image/png\r\n');
		expect(wire.endsWith('--TESTBOUND--\r\n')).toBe(true);
	});

	it('reads asset producers from the project _assets store', async () => {
		const dir = path.join(projectFolder, '_assets', SHA.slice(0, 2));
		await fs.mkdir(dir, { recursive: true });
		await fs.writeFile(path.join(dir, SHA), Buffer.from('disk-bytes'));

		const body: FlightBodyMultipart = {
			type: 'multipart',
			payload: {
				boundary: 'B',
				parts: [
					{
						kind: 'binary',
						name: 'file',
						source: { kind: 'asset', ref: { sha256: SHA, size: 10 } },
					},
				],
			},
		};

		const { bytes } = await assembleMultipart(body, { projectFolder });
		expect(bytes.toString('utf-8')).toContain('disk-bytes');
	});

	it('sanitises CR/LF out of part names so they cannot smuggle headers', async () => {
		const body: FlightBodyMultipart = {
			type: 'multipart',
			payload: {
				boundary: 'B',
				parts: [{ kind: 'text', name: 'evil\r\nX-Injected: yes', value: 'v' }],
			},
		};
		const { bytes } = await assembleMultipart(body);
		const wire = bytes.toString('binary');
		// The CRLF that would have terminated the Content-Disposition line is
		// stripped. The literal substring "X-Injected" still appears, but
		// it's inside the quoted name parameter rather than as its own
		// header — `\r\nX-Injected:` doesn't appear at line start.
		expect(wire).not.toMatch(/\r\nX-Injected:/);
		expect(wire).toContain('Content-Disposition: form-data; name="evilX-Injected: yes"');
	});
});
