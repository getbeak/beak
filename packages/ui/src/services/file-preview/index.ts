import { ipcFsService } from '@beak/ui/lib/ipc';

/**
 * Preview-file orchestration for the request body's legacy
 * `fileReferenceId` path. `FileUploadView` used to embed three copies of
 * the same "preview ? update state with metadata : clear" chain, twice
 * inside a `useEffect` and once in an event handler. Extracted so the
 * pattern lives in one place — the component just dispatches the
 * resulting outcome.
 *
 * For the new content-addressed asset path (`assetRef`) see
 * `services/assets/resolve` — it has its own resolver that handles the
 * preferred-then-fallback ordering. This module is specifically for the
 * legacy reference-file flow.
 */

export interface FilePreviewSuccess {
	kind: 'preview';
	fileReferenceId: string;
	fileExtension: string;
	/** Whatever else the IPC preview returns — passed through verbatim. */
	preview: Awaited<ReturnType<typeof ipcFsService.previewReferencedFile>>;
}

export interface FilePreviewMissing {
	kind: 'missing';
	/** The id we tried; useful for the caller to clear it from state. */
	fileReferenceId: string;
}

export type FilePreviewOutcome = FilePreviewSuccess | FilePreviewMissing;

/**
 * Resolve a legacy `fileReferenceId` to its preview metadata. Returns a
 * `missing` outcome when the IPC reports no preview — the caller
 * typically clears the reference in that case (the file got deleted out
 * from under the renderer).
 *
 * `undefined` input is treated as a no-op (returns `null`) — saves the
 * caller a guard branch around the typical "we don't have one yet" case.
 */
export async function fetchFilePreview(fileReferenceId: string | undefined): Promise<FilePreviewOutcome | null> {
	if (!fileReferenceId) return null;
	const preview = await ipcFsService.previewReferencedFile(fileReferenceId);
	if (!preview) return { kind: 'missing', fileReferenceId };
	return { kind: 'preview', fileReferenceId, fileExtension: preview.fileExtension, preview };
}

/**
 * Open the host's "pick a file" dialog and return the chosen reference.
 * Pure delegation today, but kept here so the component path doesn't
 * import `ipcFsService` directly — when picker logic grows (drag-and-
 * drop validation, recent-files, etc) this is the natural seam.
 */
export async function pickReferenceFile(): Promise<{ fileReferenceId: string } | null> {
	const response = await ipcFsService.openReferenceFile();
	return response ?? null;
}
