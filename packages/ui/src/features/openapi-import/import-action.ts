import type { SyncFromSpecRes } from '@beak/common/ipc/openapi';
import { ipcOpenApiService } from '@beak/ui/lib/ipc';

import { looksLikeOpenApi3, parseSpecSource } from './parse-spec-source';

export interface ImportOpenApiArgs {
	/** Raw text of the spec file (JSON for now). */
	source: string;
	/** Original filename — used to pick the JSON/YAML parser and as `specPath`. */
	filename?: string;
	/** Project-relative folder under `tree/` for the new collection. */
	targetFolder: string;
}

export type ImportOpenApiOutcome =
	| { ok: true; result: SyncFromSpecRes; notice?: string }
	| { ok: false; error: string };

/**
 * One-shot importer: parse the spec source, sanity-check it looks like
 * OpenAPI 3.x, and call the host's sync handler. Errors come back as
 * `{ ok: false, error }` so the UI can surface them without try/catch
 * scaffolding on each caller. The pure converter + writer do the
 * structural validation and produce warnings; this function relays them.
 */
export async function importOpenApi(args: ImportOpenApiArgs): Promise<ImportOpenApiOutcome> {
	const parsed = parseSpecSource(args.source, args.filename);
	if (!parsed.ok) return { ok: false, error: parsed.error };

	if (!looksLikeOpenApi3(parsed.spec)) {
		return {
			ok: false,
			error: 'This file does not look like an OpenAPI 3.x document (missing `openapi: 3.x`).',
		};
	}

	try {
		const result = await ipcOpenApiService.syncFromSpec({
			targetFolder: args.targetFolder,
			spec: parsed.spec,
			specPath: args.filename,
		});
		const notice = describeOutcome(result);
		return notice ? { ok: true, result, notice } : { ok: true, result };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return { ok: false, error: `Sync failed — ${message}` };
	}
}

function describeOutcome(result: SyncFromSpecRes): string | undefined {
	const parts: string[] = [];
	if (result.requestPaths.length > 0) {
		parts.push(`Wrote ${result.requestPaths.length} request${result.requestPaths.length === 1 ? '' : 's'}.`);
	}
	if (result.overwritten.length > 0) {
		parts.push(`Overwrote ${result.overwritten.length} existing file${result.overwritten.length === 1 ? '' : 's'}.`);
	}
	if (result.skipped.length > 0) {
		parts.push(`Skipped ${result.skipped.length} (unsafe filename).`);
	}
	if (result.warnings.length > 0) {
		parts.push(`${result.warnings.length} converter warning${result.warnings.length === 1 ? '' : 's'}.`);
	}
	return parts.length > 0 ? parts.join(' ') : undefined;
}
