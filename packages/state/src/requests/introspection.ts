import type { RequestFile, RequestFileOverride } from '../schemas/beak-project';

/** Same structural shape as `runtime-shared/assets`'s `AssetRef`. Duplicated
 *  here so callers don't pick up a runtime dep just to read refs. */
export interface AssetRef {
	sha256: string;
	size: number;
	contentType?: string;
}

/**
 * Walk a request and return every `AssetRef` it carries. Used by:
 * - The asset garbage collector (`runtime.gc.findOrphans`) to mark which
 *   blobs are reachable.
 * - The flight executor (deferred) to resolve binary bodies before
 *   issuing the HTTP request.
 * - The UI to surface "this request attaches a file" affordances.
 *
 * Works on either a fully-merged `RequestFile` or a sparse
 * `RequestFileOverride` — the body shape is identical in both, just
 * optional on the override.
 *
 * Pure function; no I/O.
 */
export function extractAssetRefs(request: RequestFile | RequestFileOverride): AssetRef[] {
	const out: AssetRef[] = [];

	const body = request.body;
	if (body?.type === 'file' && body.payload && typeof body.payload === 'object') {
		const ref = (body.payload as { assetRef?: AssetRef }).assetRef;
		if (ref && isAssetRef(ref)) out.push(ref);
	}

	return out;
}

/**
 * Count the asset references in a request. Cheaper than `.length` on the
 * extracted array when the caller only needs a presence check.
 */
export function countAssetRefs(request: RequestFile | RequestFileOverride): number {
	const body = request.body;
	if (body?.type !== 'file') return 0;
	const ref = (body.payload as { assetRef?: unknown }).assetRef;
	return ref && isAssetRef(ref) ? 1 : 0;
}

function isAssetRef(value: unknown): value is AssetRef {
	if (!value || typeof value !== 'object') return false;
	const v = value as { sha256?: unknown; size?: unknown };
	return typeof v.sha256 === 'string' && v.sha256.length === 64 && typeof v.size === 'number';
}
