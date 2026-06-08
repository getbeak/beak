import { insertRequestNode } from '@beak/state/project';
import { closeTab } from '@beak/ui/features/tabs/store/actions';
import { ipcDialogService } from '@beak/ui/lib/ipc';
import * as projectActions from '@beak/ui/store/project/actions';
import type { RequestNode } from '@getbeak/types/nodes';
import { readRequestNode, unlinkAndPersistAs } from './request';

export interface LinkedApi {
	getState: () => {
		global: {
			project: {
				tree: Record<string, { type: string; filePath: string } | undefined>;
			};
		};
	};
	dispatch: (a: unknown) => unknown;
}

/**
 * Persist an unlinked copy of the linked request, then clear dirty/confirm state.
 */
export async function runUnlinkAndRename(requestId: string, api: LinkedApi): Promise<void> {
	const node = api.getState().global.project.tree[requestId];
	if (!node || node.type !== 'request') return;

	try {
		const persisted = await unlinkAndPersistAs(node as RequestNode);
		if (!persisted) return;
		api.dispatch(projectActions.linkedDirtyCleared({ requestId }));
		api.dispatch(projectActions.unlinkConfirmDismiss());
		api.dispatch(closeTab(requestId));
	} catch (error) {
		if (!(error instanceof Error)) return;
		await ipcDialogService.showMessageBox({
			type: 'error',
			title: 'Unlink failed',
			message: "We couldn't persist your edits to a new file.",
			detail: [error.message, error.stack].join('\n'),
		});
	}
}

/**
 * Re-read from disk and snap state back to the spec version, clearing dirty/stale flags.
 */
export async function runRelinkRequest(requestId: string, api: LinkedApi): Promise<void> {
	const node = api.getState().global.project.tree[requestId];
	if (!node || node.type !== 'request') return;

	const refreshed = await readRequestNode(node.filePath);
	api.dispatch(insertRequestNode(refreshed));
	api.dispatch(projectActions.linkedDirtyCleared({ requestId }));
	api.dispatch(projectActions.linkedStaleCleared({ requestId }));
}

/**
 * Accept the disk version after a stale-reload prompt.
 */
export async function runReloadStaleRequest(requestId: string, api: LinkedApi): Promise<void> {
	const node = api.getState().global.project.tree[requestId];
	if (!node || node.type !== 'request') return;

	const refreshed = await readRequestNode(node.filePath);
	api.dispatch(insertRequestNode(refreshed));
	api.dispatch(projectActions.linkedDirtyCleared({ requestId }));
	api.dispatch(projectActions.linkedStaleCleared({ requestId }));
	api.dispatch(projectActions.staleReloadDismiss());
}
