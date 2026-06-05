import type { AssetRef } from './types';

/**
 * Directory at the root of a project that holds asset blobs. Content-addressed,
 * sharded by the first two hex characters of the sha256 to keep any single
 * directory small.
 *
 * Path example for sha256 `ab12…f3`: `_assets/ab/ab12…f3`.
 */
export const ASSETS_DIRNAME = '_assets';

export function assetDirname(sha256: string): string {
	if (sha256.length < 2) throw new Error(`bad sha256 '${sha256}'`);
	return sha256.slice(0, 2);
}

/**
 * Path to an asset blob *relative to the project root*. Callers join this with
 * the project folder to get an absolute path. Kept platform-neutral so the
 * web (lightning-fs) and electron (node fs) runtimes can both use it.
 */
export function relativeAssetPath(ref: AssetRef | { sha256: string }): string {
	return `${ASSETS_DIRNAME}/${assetDirname(ref.sha256)}/${ref.sha256}`;
}

/**
 * Pretty printer for UI hover/tooltips. Example: "sha256:ab12…ef34 (12.3 KB)".
 */
export function describeAsset(ref: AssetRef): string {
	const short = `${ref.sha256.slice(0, 4)}…${ref.sha256.slice(-4)}`;
	return `sha256:${short} (${formatBytes(ref.size)})`;
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
