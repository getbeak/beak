import type { IpcDialogServiceRenderer } from '@beak/common/ipc/dialog';

import { importOpenApi } from './import-action';
import { pickSpecFile } from './pick-file';

const DEFAULT_TARGET_FOLDER = 'tree/openapi';

interface RunOpenApiImportFlowDeps {
	dialog: Pick<IpcDialogServiceRenderer, 'showMessageBox'>;
	pickFile?: () => Promise<{ filename: string; source: string } | null>;
}

/**
 * The end-to-end "Import OpenAPI spec…" flow triggered from the application
 * menu. Prompts for a file, parses + sanity-checks, calls the host sync
 * IPC, and surfaces the outcome through a message box.
 *
 * Side effects are isolated behind `deps` so tests can drive the flow
 * without touching the DOM or the IPC layer.
 */
export async function runOpenApiImportFlow(deps: RunOpenApiImportFlowDeps): Promise<void> {
	const pickFile = deps.pickFile ?? pickSpecFile;
	const picked = await pickFile();
	if (!picked) return; // user cancelled

	const outcome = await importOpenApi({
		source: picked.source,
		filename: picked.filename,
		targetFolder: DEFAULT_TARGET_FOLDER,
	});

	if (!outcome.ok) {
		await deps.dialog.showMessageBox({
			type: 'error',
			title: 'Import failed',
			message: outcome.error,
		});
		return;
	}

	await deps.dialog.showMessageBox({
		type: 'info',
		title: 'OpenAPI imported',
		message:
			outcome.notice ??
			`Imported into ${DEFAULT_TARGET_FOLDER}. The collection is ready to edit in the project tree.`,
	});
}
