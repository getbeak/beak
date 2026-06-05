import type { FetchTextRes } from '@beak/common/ipc/http';
import type { SyncFromSpecRes } from '@beak/common/ipc/openapi';
import { looksLikeOpenApi3, parseSpecSource } from '@beak/ui/features/openapi-import/parse-spec-source';
import { ipcHttpService, ipcOpenApiService } from '@beak/ui/lib/ipc';

export interface SyncFromUrlArgs {
	/** Project-relative target folder (e.g. `tree/users`). */
	targetFolder: string;
	url: string;
	autoSync?: boolean;
	intervalMinutes?: number;
	/** Mirror the URL hierarchy in the tree (`/api/agents/{id}` → `api/agents/`). */
	groupByPath?: boolean;
}

export type SyncFromUrlOutcome = { ok: true; result: SyncFromSpecRes } | { ok: false; error: string };

/**
 * Pull an OpenAPI spec from a URL and write the converted collection into
 * `targetFolder`. Calls `ipcHttpService` so the actual HTTP request runs
 * on the host (no CORS in electron; web shells live with browser CORS).
 *
 * Idempotent on the wire — re-syncing the same URL produces the same
 * collection / requests, so the poller can call this repeatedly without
 * worrying about dupes.
 */
export async function syncFromUrl(args: SyncFromUrlArgs): Promise<SyncFromUrlOutcome> {
	try {
		new URL(args.url);
	} catch {
		return { ok: false, error: `Invalid URL: ${args.url}` };
	}

	let response: FetchTextRes;
	try {
		response = await ipcHttpService.fetchText({ url: args.url });
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return { ok: false, error: `Network error fetching spec — ${message}` };
	}

	if (!response.ok) {
		const reason = response.status === 0 ? response.body || 'fetch failed before completion' : `HTTP ${response.status}`;
		return { ok: false, error: `Failed to download spec (${reason})` };
	}

	const parsed = parseSpecSource(response.body, hintFromContentType(response.contentType));
	if (!parsed.ok) return { ok: false, error: parsed.error };

	if (!looksLikeOpenApi3(parsed.spec)) {
		return { ok: false, error: 'Downloaded document is not OpenAPI 3.x (missing `openapi: 3.x`).' };
	}

	try {
		const result = await ipcOpenApiService.syncFromSpec({
			targetFolder: args.targetFolder,
			spec: parsed.spec,
			seedMode: 'url',
			specUrl: args.url,
			autoSync: args.autoSync,
			intervalMinutes: args.intervalMinutes,
			...(args.groupByPath ? { groupByPath: true } : {}),
		});
		return { ok: true, result };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return { ok: false, error: `Sync failed — ${message}` };
	}
}

function hintFromContentType(contentType: string | undefined): string | undefined {
	if (!contentType) return undefined;
	if (/yaml/i.test(contentType)) return 'spec.yaml';
	if (/json/i.test(contentType)) return 'spec.json';
	return undefined;
}
