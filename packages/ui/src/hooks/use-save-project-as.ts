import type { MaterialiseTreeNode, MaterialiseVariableSet } from '@beak/common/ipc/project';
import type { Nodes } from '@getbeak/types/nodes';
import type { VariableSet } from '@getbeak/types/variable-sets';
import { useCallback } from 'react';

import { ipcDialogService, ipcProjectService } from '../lib/ipc';
import { useAppSelector } from '../store/redux';

/**
 * Save the current project to a folder the user picks. Memory-mode projects
 * call `materialiseFromMemory` (writes the in-memory tree + variable-sets
 * onto a freshly-scaffolded project). Legacy on-disk untitled projects (the
 * old `userData/untitled-projects/<ksuid>/` mechanism) still go through
 * `promoteUntitled` until P5 retires them.
 *
 * Disk-mode projects don't need a save action — they're already on disk.
 * Calling the returned function is a no-op in that case.
 */
export function useSaveProjectAs() {
	const mode = useAppSelector(s => s.global.project.mode);
	const projectName = useAppSelector(s => s.global.project.name) ?? 'Untitled';
	const tree = useAppSelector(s => s.global.project.tree);
	const variableSets = useAppSelector(s => s.global.variableSets.variableSets);

	return useCallback(async () => {
		try {
			if (mode === 'memory') {
				await ipcProjectService.materialiseFromMemory({
					projectName,
					tree: serialiseTree(tree),
					variableSets: serialiseVariableSets(variableSets),
				});
				return;
			}

			// Legacy on-disk untitled project. The IPC will pick up the
			// current window's project folder and rename it.
			await ipcProjectService.promoteUntitled({});
		} catch (err) {
			console.warn('Save Project As… failed', err);
			await ipcDialogService.showMessageBox({
				type: 'error',
				title: 'Save Project As… failed',
				message: 'Beak couldn’t save this project.',
				detail: err instanceof Error ? err.message : String(err),
			});
		}
	}, [mode, projectName, tree, variableSets]);
}

function serialiseTree(tree: Record<string, Nodes>): Record<string, MaterialiseTreeNode> {
	const out: Record<string, MaterialiseTreeNode> = {};
	for (const [key, node] of Object.entries(tree)) {
		const base: MaterialiseTreeNode = {
			id: node.id,
			type: node.type,
			name: node.name,
			filePath: node.filePath,
			parent: node.parent,
		};
		if (node.type === 'request') {
			base.mode = node.mode;
			if (node.mode === 'valid') base.info = { ...node.info } as Record<string, unknown>;
		}
		out[key] = base;
	}
	return out;
}

function serialiseVariableSets(sets: Record<string, VariableSet>): Record<string, MaterialiseVariableSet> {
	const out: Record<string, MaterialiseVariableSet> = {};
	for (const [name, set] of Object.entries(sets)) {
		out[name] = {
			sets: { ...set.sets },
			items: { ...set.items },
			values: { ...set.values },
		};
	}
	return out;
}
