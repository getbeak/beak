import type { AssetRefDto, WriteAssetRes } from '@beak/common/ipc/assets';
import { ipcAssetsService } from '@beak/ui/lib/ipc';

export interface AttachFileArgs {
	file: { name: string; type?: string; bytes: Uint8Array };
}

export type AttachFileOutcome =
	| { ok: true; ref: AssetRefDto; relativePath: string; filename: string }
	| { ok: false; error: string };

/**
 * Persist a user-supplied file into the project's content-addressed asset
 * store and return its {@link AssetRefDto}. Writes are idempotent — uploading
 * the same bytes twice points at one blob.
 *
 * Pure of UI concerns: the caller is responsible for prompting for a file
 * and turning it into bytes. That separation keeps this testable without
 * jsdom file pickers.
 */
export async function attachFile(args: AttachFileArgs): Promise<AttachFileOutcome> {
	if (args.file.bytes.byteLength === 0) {
		return { ok: false, error: 'File is empty.' };
	}

	try {
		const res: WriteAssetRes = await ipcAssetsService.write({
			bytes: args.file.bytes,
			contentType: args.file.type || undefined,
		});
		return {
			ok: true,
			ref: res.ref,
			relativePath: res.relativePath,
			filename: args.file.name,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return { ok: false, error: `Could not save asset — ${message}` };
	}
}
