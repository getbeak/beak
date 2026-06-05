import type { AssetRef } from '@getbeak/extension-sdk';

/**
 * Resolution rules for a file request body's binary content.
 *
 * Two paths exist for historical reasons:
 *  - `assetRef` — the new content-addressed pointer into the project's
 *    `_assets/` store. Preferred.
 *  - `fileReferenceId` — the legacy session-scoped binary handle.
 *    Kept for projects that haven't been migrated to the asset store.
 *
 * Three places in the codebase need to read the body's bytes: flight
 * prep, the HTTP preview, and the body editor's preview pane. Spelling
 * out the "prefer assetRef, fall back to fileReferenceId, else empty"
 * rule at each callsite is how `RequestOutput.tsx` ended up with a
 * silently-broken preview for asset-based bodies. This module is the
 * single source of truth.
 */

export interface AssetResolveDeps {
	/** Read bytes from the content-addressed asset store. `null` when missing. */
	readAsset: (ref: AssetRef) => Promise<{ body: Uint8Array } | null>;
	/** Read bytes from the legacy session-scoped binary handle. */
	readReferencedFile: (fileReferenceId: string) => Promise<{ body: Uint8Array }>;
}

export type AssetResolveResult =
	| { kind: 'asset'; bytes: Uint8Array; ref: AssetRef }
	| { kind: 'file'; bytes: Uint8Array; fileReferenceId: string }
	| { kind: 'missing'; reason: 'no-pointers' | 'asset-not-found' }
	| { kind: 'error'; error: unknown };

/**
 * Resolve the bytes for a `file` body payload. Tries `assetRef` first
 * when present, falls back to `fileReferenceId`, and surfaces the
 * missing / error cases as Result discriminators so callers can decide
 * whether to render empty / show an alert / fail the flight.
 */
export async function resolveAssetBytes(
	payload: { assetRef?: AssetRef; fileReferenceId?: string },
	deps: AssetResolveDeps,
): Promise<AssetResolveResult> {
	try {
		if (payload.assetRef) {
			const res = await deps.readAsset(payload.assetRef);
			if (res) return { kind: 'asset', bytes: res.body, ref: payload.assetRef };
			return { kind: 'missing', reason: 'asset-not-found' };
		}
		if (payload.fileReferenceId) {
			const res = await deps.readReferencedFile(payload.fileReferenceId);
			return { kind: 'file', bytes: res.body, fileReferenceId: payload.fileReferenceId };
		}
		return { kind: 'missing', reason: 'no-pointers' };
	} catch (error) {
		return { kind: 'error', error };
	}
}
