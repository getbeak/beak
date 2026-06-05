import type { AssetRef } from '@getbeak/extension-sdk';

import { BeakBase } from '../base';

export type { AssetRef };

const ASSETS_DIRNAME = '_assets';

function assetDirname(sha256: string): string {
	if (sha256.length < 2) throw new Error(`bad sha256 '${sha256}'`);
	return sha256.slice(0, 2);
}

function relativeAssetPath(sha256: string): string {
	return `${ASSETS_DIRNAME}/${assetDirname(sha256)}/${sha256}`;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
	const subtle = (globalThis as { crypto?: { subtle?: SubtleCrypto } }).crypto?.subtle;
	if (!subtle || typeof subtle.digest !== 'function') {
		throw new Error('WebCrypto SubtleCrypto.digest is unavailable in this runtime — cannot compute sha256');
	}
	const view = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
	const digest = await subtle.digest('SHA-256', view);
	const out = new Uint8Array(digest);
	let s = '';
	for (let i = 0; i < out.length; i++) {
		const v = out[i].toString(16);
		s += v.length === 1 ? `0${v}` : v;
	}
	return s;
}

/**
 * Runtime-side store for content-addressed binary assets. Bytes are written
 * to `<projectRoot>/_assets/<prefix>/<sha256>` and addressed by an
 * {@link AssetRef}. Identical bytes share storage — the writer is idempotent
 * (writing an existing asset is a no-op apart from re-validating the path).
 *
 * Operates on `this.providers.node.fs`, so the same code works on the
 * Electron host (native fs) and the web host (lightning-fs). Path joining
 * goes through `this.providers.node.path` to stay platform-neutral.
 */
export default class AssetStore extends BeakBase {
	/**
	 * Write a buffer to the project's `_assets/` store and return its ref.
	 * Idempotent — re-writing the same bytes is a no-op. The directory
	 * shard is created lazily.
	 */
	async write(projectRoot: string, buffer: Uint8Array, contentType?: string): Promise<AssetRef> {
		const sha256 = await sha256Hex(buffer);
		const ref: AssetRef = {
			sha256,
			size: buffer.byteLength,
			...(contentType ? { contentType } : {}),
		};

		const fullPath = this.toAbsolute(projectRoot, sha256);

		if (!(await this.fileExists(fullPath))) {
			const dir = this.p.node.path.dirname(fullPath);
			await this.p.node.fs.promises.mkdir(dir, { recursive: true });
			await this.p.node.fs.promises.writeFile(fullPath, buffer);
		}

		return ref;
	}

	/**
	 * Read an asset's bytes. Returns `null` when the asset is missing — most
	 * callers want to surface a UI affordance rather than crash on a stale
	 * ref. Callers that *require* the bytes should check for null.
	 */
	async read(projectRoot: string, ref: AssetRef): Promise<Uint8Array | null> {
		const fullPath = this.toAbsolute(projectRoot, ref.sha256);
		if (!(await this.fileExists(fullPath))) return null;
		const bytes = await this.p.node.fs.promises.readFile(fullPath);
		return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	}

	async exists(projectRoot: string, ref: AssetRef): Promise<boolean> {
		return this.fileExists(this.toAbsolute(projectRoot, ref.sha256));
	}

	/**
	 * Delete an asset's bytes. The store does not garbage-collect assets
	 * implicitly — callers (typically a `beak gc` command) decide when an
	 * asset is no longer reachable from any request file.
	 */
	async delete(projectRoot: string, ref: AssetRef): Promise<void> {
		const fullPath = this.toAbsolute(projectRoot, ref.sha256);
		try {
			await this.p.node.fs.promises.rm(fullPath, { force: true });
		} catch {
			// Already gone — treat as success.
		}
	}

	private toAbsolute(projectRoot: string, sha256: string): string {
		return this.p.node.path.join(projectRoot, relativeAssetPath(sha256));
	}

	private async fileExists(filePath: string): Promise<boolean> {
		try {
			await this.p.node.fs.promises.stat(filePath);
			return true;
		} catch {
			return false;
		}
	}
}
