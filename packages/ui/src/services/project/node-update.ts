import { provenance } from '@beak/state';
import type { ProjectMode } from '@beak/state/project';
import * as projectActions from '@beak/ui/store/project/actions';
import type { RequestNode, Tree } from '@getbeak/types/nodes';
import * as uuid from 'uuid';
import { writeRequestNode } from './request';

export interface NodeUpdateApi {
	getState: () => {
		global: {
			project: {
				mode: ProjectMode;
				tree: Tree;
				linkedDirty: Record<string, boolean>;
				writeDebouncer: Record<string, string>;
			};
		};
	};
	dispatch: (a: unknown) => unknown;
	delay: (ms: number) => Promise<void>;
}

/**
 * Handle a node-update action: in disk mode, mark the write debounce,
 * wait 500 ms, and (if still the latest nonce) persist the node to disk.
 * In memory mode the write is skipped — redux is the source of truth.
 */
export async function handleNodeUpdate(requestId: string, api: NodeUpdateApi): Promise<void> {
	if (api.getState().global.project.mode !== 'disk') return;

	let raw = api.getState().global.project.tree[requestId];
	if (!raw || raw.type !== 'request') return;
	let node = raw as RequestNode;

	// Linked requests are read-only on disk until the user explicitly unlinks.
	// Mark dirty so the UI can signal unsaved state, then skip the write.
	if (node.mode === 'valid' && provenance.isLinked(node.info)) {
		if (!api.getState().global.project.linkedDirty[requestId]) {
			api.dispatch(projectActions.linkedDirtyMarked({ requestId }));
		}
		return;
	}

	const nonce = uuid.v4();
	api.dispatch(projectActions.setWriteDebounce({ requestId, nonce }));
	await api.delay(500);

	const debounce = api.getState().global.project.writeDebouncer[requestId];
	if (debounce !== nonce) return;

	raw = api.getState().global.project.tree[requestId];
	if (!raw || raw.type !== 'request') return;
	node = raw as RequestNode;

	api.dispatch(projectActions.setLatestWrite({ filePath: node.filePath, writtenAt: Date.now() }));
	await writeRequestNode(node);
}
