import { sha256Hex } from './digest';
import type { AssetRef } from './types';

export { sha256Hex } from './digest';
export { ASSETS_DIRNAME, assetDirname, describeAsset, relativeAssetPath } from './paths';
export { assetRefSchema } from './types';
export type { AssetRef } from './types';

/**
 * Compute an {@link AssetRef} for a binary buffer. The runtime caller is
 * responsible for writing the bytes to `relativeAssetPath(ref)` once it has
 * the ref — this module deliberately does no I/O.
 */
export async function assetRefForBuffer(
	buffer: Uint8Array | ArrayBuffer,
	contentType?: string,
): Promise<AssetRef> {
	const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
	const sha256 = await sha256Hex(bytes);
	const ref: AssetRef = {
		sha256,
		size: bytes.byteLength,
		...(contentType ? { contentType } : {}),
	};
	return ref;
}
