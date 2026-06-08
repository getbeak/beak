import type { ExportFromFolderRes } from '@beak/common/ipc/openapi';
import { ipcOpenApiService } from '@beak/ui/lib/ipc';

export interface ExportOpenApiArgs {
	/** Project-relative folder under tree/ whose collection + requests get exported. */
	folder?: string;
	title?: string;
	version?: string;
	description?: string;
	/**
	 * Variable set whose `baseUrl` items should populate `servers[]`. Defaults
	 * to `Environments` — what the importer uses. Pass `null` to skip server
	 * resolution entirely.
	 */
	variableSetName?: string | null;
	/** Filename suggested to the browser/OS download prompt. */
	suggestedFilename?: string;
}

export type ExportOpenApiOutcome =
	| { ok: true; result: ExportFromFolderRes; notice?: string }
	| { ok: false; error: string };

/**
 * One-shot exporter: call the host's `exportFromFolder`, get a fully-built
 * OpenAPI document back, and trigger a browser download of the
 * pretty-printed JSON. The user can save it wherever they like via the
 * normal save prompt — no save-dialog IPC needed today. YAML output can
 * land later by re-emitting through a YAML serialiser.
 *
 * Errors are returned as `{ ok: false, error }` so callers don't need
 * try/catch scaffolding.
 */
export async function exportOpenApi(args: ExportOpenApiArgs = {}): Promise<ExportOpenApiOutcome> {
	const folder = args.folder ?? '';
	const variableSetName = args.variableSetName === null ? undefined : (args.variableSetName ?? 'Environments');
	try {
		const result = await ipcOpenApiService.exportFromFolder({
			folder,
			...(args.title ? { title: args.title } : {}),
			...(args.version ? { version: args.version } : {}),
			...(args.description ? { description: args.description } : {}),
			...(variableSetName ? { variableSetName } : {}),
		});
		downloadAsJson(result.document, args.suggestedFilename ?? defaultFilename(args.title, folder));
		const notice = describeOutcome(result);
		return notice ? { ok: true, result, notice } : { ok: true, result };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return { ok: false, error: `Export failed — ${message}` };
	}
}

function defaultFilename(title: string | undefined, folder: string): string {
	const base = title?.trim() || folder.split('/').filter(Boolean).pop() || 'openapi';
	return `${slugify(base)}.openapi.json`;
}

function slugify(s: string): string {
	return (
		s
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 80) || 'openapi'
	);
}

function downloadAsJson(document: unknown, filename: string): void {
	const blob = new Blob([JSON.stringify(document, null, '\t')], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	try {
		const a = window.document.createElement('a');
		a.href = url;
		a.download = filename;
		window.document.body.appendChild(a);
		a.click();
		a.remove();
	} finally {
		// Defer the revoke so the click has a tick to start the download.
		setTimeout(() => URL.revokeObjectURL(url), 0);
	}
}

function describeOutcome(result: ExportFromFolderRes): string | undefined {
	const parts: string[] = [];
	if (result.warnings.length > 0) {
		parts.push(`${result.warnings.length} converter warning${result.warnings.length === 1 ? '' : 's'}.`);
	}
	if (result.skipped.length > 0) {
		parts.push(`${result.skipped.length} file${result.skipped.length === 1 ? '' : 's'} skipped on read.`);
	}
	return parts.length > 0 ? parts.join(' ') : undefined;
}
