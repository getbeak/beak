import type { CollectionSource } from '@beak/state/schemas';

import type { SyncFromUrlArgs, SyncFromUrlOutcome } from '@beak/ui/features/project-home/lib/sync-from-url';

/**
 * Re-fetch an OpenAPI spec for a URL-mode source and overwrite the
 * generated collection in place. Wraps `syncFromUrl` so the result shape
 * is uniform with the gRPC discover orchestration — both return Result
 * discriminators that callers translate into alert insert / remove +
 * row refresh.
 */
export interface OpenApiSyncDeps {
	syncFromUrl: (args: SyncFromUrlArgs) => Promise<SyncFromUrlOutcome>;
}

export interface OpenApiSyncInput {
	folderPath: string;
	folderName: string;
	source: Extract<CollectionSource, { type: 'openapi' }>;
}

export type OpenApiSyncResult =
	| { kind: 'ok' }
	| { kind: 'skipped'; reason: 'no-spec-url' }
	| { kind: 'error'; errorMessage: string };

export async function syncOpenApiFromSource(
	input: OpenApiSyncInput,
	deps: OpenApiSyncDeps,
): Promise<OpenApiSyncResult> {
	if (!input.source.specUrl) return { kind: 'skipped', reason: 'no-spec-url' };

	const outcome = await deps.syncFromUrl({
		targetFolder: input.folderPath,
		url: input.source.specUrl,
		autoSync: input.source.autoSync,
		intervalMinutes: input.source.intervalMinutes,
	});

	if (outcome.ok) return { kind: 'ok' };
	return { kind: 'error', errorMessage: outcome.error };
}
