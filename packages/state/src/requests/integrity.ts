import type { RequestFile, RequestFileOverride } from '../schemas/beak-project';
import { type AssetRef, extractAssetRefs } from './introspection';

export interface IntegrityReport {
	missing: AssetRef[];
	present: AssetRef[];
}

/**
 * Given a request and the set of asset shas that actually exist on disk,
 * report which referenced refs are missing.
 *
 * Pure, no I/O. Callers (a `beak doctor` command, an inline UI banner)
 * pre-compute the available set — usually via
 * `runtime.gc.findStoredShas(projectRoot)` — and pass it in.
 *
 * An empty `missing` array means the request can run; a non-empty one
 * means at least one body-file points at a blob that no longer exists
 * (deleted by a GC pass, lost in a git checkout, etc.).
 */
export function checkAssetIntegrity(
	request: RequestFile | RequestFileOverride,
	availableShas: ReadonlySet<string>,
): IntegrityReport {
	const refs = extractAssetRefs(request);
	const missing: AssetRef[] = [];
	const present: AssetRef[] = [];
	for (const ref of refs) {
		if (availableShas.has(ref.sha256)) present.push(ref);
		else missing.push(ref);
	}
	return { missing, present };
}

/**
 * Aggregate variant: report integrity for many requests at once. Returns a
 * map keyed by `requestId` so a caller can render per-row warnings without
 * looping twice.
 */
export function checkProjectIntegrity(
	requests: Array<{ id: string; request: RequestFile | RequestFileOverride }>,
	availableShas: ReadonlySet<string>,
): Record<string, IntegrityReport> {
	const out: Record<string, IntegrityReport> = {};
	for (const { id, request } of requests) {
		out[id] = checkAssetIntegrity(request, availableShas);
	}
	return out;
}
