/**
 * ProjectLoaderService — turn an on-disk Beak project into the renderer's
 * initial state.
 *
 * The function is intentionally pure with respect to redux: it reads the
 * filesystem, validates schemas, and returns a typed Result. The caller
 * (the `startProject` listener) handles dispatching actions and showing
 * UI. Keeping the load logic out of redux makes it testable in isolation,
 * lets us reuse it from a future "Open recent" path without a fresh
 * dispatch dance, and means the failure surface is one shape — a Squawk —
 * instead of a soup of thrown Errors and message-box branches.
 */

import Squawk from '@beak/common/utils/squawk';
import { readFolderNode } from '@beak/ui/lib/beak-project/folder';
import { readProjectFile } from '@beak/ui/lib/beak-project/project';
import { readRequestNode } from '@beak/ui/lib/beak-project/request';
import { scanDirectoryRecursively } from '@beak/ui/lib/fs-emitter';
import type { Tree } from '@getbeak/types/nodes';
import type { ProjectFile } from '@getbeak/types/project';

export interface ProjectLoadInfo {
	id: string;
	name: string;
	mode: 'memory' | 'disk';
}

export interface ProjectLoadValue {
	info: ProjectLoadInfo;
	tree: Tree;
}

export type ProjectLoadResult = { kind: 'ok'; value: ProjectLoadValue } | { kind: 'error'; error: Squawk };

/**
 * Read + validate the project, then build the initial node tree. Any
 * failure is folded into a Squawk so callers don't have to discriminate
 * on raw Error messages.
 */
export async function loadProject(treePath = 'tree'): Promise<ProjectLoadResult> {
	let project: ProjectFile;
	try {
		project = await readProjectFile();
	} catch (error) {
		return { kind: 'error', error: mapProjectReadError(error) };
	}

	let tree: Tree;
	try {
		tree = await importTree(treePath);
	} catch (error) {
		return { kind: 'error', error: Squawk.coerce(error) };
	}

	return {
		kind: 'ok',
		value: {
			// Anything loaded from disk is `mode: 'disk'`. Old on-disk untitled
			// projects (the legacy `userData/untitled-projects/<ksuid>/`
			// mechanism) keep their `untitled: true` flag in project.json but
			// the renderer ignores it — those folders just become regular disk
			// projects and the banner stops appearing.
			info: { id: project.id, name: project.name, mode: 'disk' },
			tree,
		},
	};
}

async function importTree(treePath: string): Promise<Tree> {
	const items = await scanDirectoryRecursively(treePath);

	const folderPaths = items.filter(s => s.isDirectory).map(s => s.path);
	const requestPaths = items.filter(s => !s.isDirectory).map(s => s.path);

	const [folderNodes, requestNodes] = await Promise.all([
		Promise.all(folderPaths.map(p => readFolderNode(p))),
		Promise.all(requestPaths.map(p => readRequestNode(p))),
	]);

	const tree: Tree = {} as Tree;
	for (const node of folderNodes) tree[node.id] = node;
	for (const node of requestNodes) tree[node.id] = node;
	return tree;
}

/**
 * Promote the two well-known version-mismatch sentinels to typed kinds so
 * the error UI can render specific guidance. Everything else flows through
 * `Squawk.coerce` unchanged.
 */
function mapProjectReadError(error: unknown): Squawk {
	if (error instanceof Error && error.message === 'Legacy project detected') {
		return new Squawk('project_legacy', {
			message: 'This project is older than the current version of Beak supports.',
		});
	}
	if (error instanceof Error && error.message === 'Future project detected') {
		return new Squawk('project_future', {
			message: 'This project was saved by a newer version of Beak — please update Beak to open it.',
		});
	}
	return Squawk.coerce(error);
}
