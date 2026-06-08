import { createReadStream, type ReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { ValueProducerHandle } from '@beak/common/types/value-producers';

const SHA256_RE = /^[0-9a-f]{64}$/;

/**
 * Resolve an asset's on-disk path under the project's `_assets/` tree,
 * guarding against path traversal. The sha256 must match the canonical
 * 64-hex pattern; anything else (including `..` segments smuggled into
 * the field) throws before we touch the filesystem.
 *
 * Threat: a malicious extension's `resolve()` could return
 * `{ kind: 'asset', ref: { sha256: '../../etc/passwd' } }`. Without
 * this guard the requester would happily `fs.readFile` arbitrary files
 * and ship their contents as the HTTP body — a one-step exfil.
 */
function resolveAssetPath(projectFolder: string, sha256: string): string {
	if (!SHA256_RE.test(sha256)) {
		throw new Error(`invalid asset sha256 — expected 64 lowercase hex chars, got ${JSON.stringify(sha256)}`);
	}
	const assetsRoot = path.resolve(projectFolder, '_assets');
	const fullPath = path.join(assetsRoot, sha256.slice(0, 2), sha256);
	// Defense in depth: the regex above already rules out `..`, but a
	// final containment check makes the safety property obvious to
	// any reader.
	const resolved = path.resolve(fullPath);
	if (!resolved.startsWith(assetsRoot + path.sep) && resolved !== assetsRoot) {
		throw new Error(`asset path escaped _assets: ${resolved}`);
	}
	return resolved;
}

/**
 * Read the bytes a {@link ValueProducerHandle} describes into a Buffer.
 *
 * The asset path reads `<projectFolder>/_assets/<sha-prefix>/<sha>`
 * directly — no IPC, no renderer hop. When the asset is missing or
 * `projectFolder` isn't set (e.g. an automation flight), it surfaces
 * as an empty buffer rather than throwing; callers can decide whether
 * an empty body means "skip" or "fail".
 *
 * For streaming producers, use {@link streamProducerToReadable} from
 * `stream-host` — buffering a stream through this helper defeats the
 * streaming win.
 */
export async function readProducerToBuffer(
	producer: ValueProducerHandle,
	projectFolder: string | undefined,
): Promise<Buffer> {
	switch (producer.kind) {
		case 'inline':
			return Buffer.from(producer.bytes);
		case 'asset': {
			if (!projectFolder) {
				console.error('asset producer with no projectFolder; emitting empty body', producer.ref.sha256);
				return Buffer.alloc(0);
			}
			let fullPath: string;
			try {
				fullPath = resolveAssetPath(projectFolder, producer.ref.sha256);
			} catch (err) {
				console.error('asset producer rejected', producer.ref.sha256, err);
				return Buffer.alloc(0);
			}
			try {
				return await fs.readFile(fullPath);
			} catch (err) {
				console.error('asset producer read failed', producer.ref.sha256, err);
				return Buffer.alloc(0);
			}
		}
		case 'stream':
			// Multipart parts can't take a stream today because the assembler
			// needs the bytes in hand to compute the boundary frames. Use
			// {@link streamProducerToReadable} for file-body streaming.
			throw new Error(
				`stream producer ${producer.streamId} reached readProducerToBuffer — use streamProducerToReadable for the wire body`,
			);
	}
}

/**
 * Resolve a producer handle to whatever node-fetch can take as a body.
 * Asset producers become a `fs.createReadStream` so node-fetch pipes
 * directly from disk — the requester never allocates a `Buffer` for
 * the bytes. A 1 GB file body uploads at ~64 KiB at a time, not 1 GB.
 *
 * Inline (and not-yet-wired stream) producers fall back to the buffer
 * path; their bytes are already in memory anyway.
 */
export async function openAssetStreamOrBuffer(
	producer: ValueProducerHandle,
	projectFolder: string | undefined,
): Promise<Buffer | ReadStream> {
	if (producer.kind === 'asset' && projectFolder) {
		try {
			return createReadStream(resolveAssetPath(projectFolder, producer.ref.sha256));
		} catch (err) {
			console.error('asset stream rejected', producer.ref.sha256, err);
			return Buffer.alloc(0);
		}
	}
	return await readProducerToBuffer(producer, projectFolder);
}
