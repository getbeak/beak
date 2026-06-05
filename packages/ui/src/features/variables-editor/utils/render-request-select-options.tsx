import { projectTree } from '@beak/state';
import type { FolderNode, RequestNode, Tree } from '@getbeak/types/nodes';
import type { Context } from '@getbeak/types/values';
import React from 'react';

const NATURAL_SORT = (a: { name: string }, b: { name: string }) =>
	a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });

export default function renderRequestSelectOptions(context: Context) {
	const tree = context.projectTree;
	const folders = projectTree.findChildren(tree, 'tree', 'folder').slice().sort(NATURAL_SORT);
	const requests = projectTree.findChildren(tree, 'tree', 'request').slice().sort(NATURAL_SORT);

	return (
		<React.Fragment>
			{folders.map(f => renderFolder(f, tree, 0))}
			{requests.map(r => renderRequest(r, 0))}
		</React.Fragment>
	);
}

function renderFolder(node: FolderNode, tree: Tree, depth: number) {
	const newDepth = depth + 1;
	// Folders are keyed by filePath in this codebase, so children store the
	// folder's filePath in their `parent` field — same value as `node.id`
	// for folder nodes today, but address by filePath to match what the
	// project loader writes.
	const childFolders = projectTree.findChildren(tree, node.filePath, 'folder').slice().sort(NATURAL_SORT);
	const childRequests = projectTree.findChildren(tree, node.filePath, 'request').slice().sort(NATURAL_SORT);

	return (
		<React.Fragment key={node.id}>
			<optgroup label={`${renderDepth(depth)}${node.name}`}>{childRequests.map(n => renderRequest(n, newDepth))}</optgroup>
			{childFolders.map(n => renderFolder(n, tree, newDepth))}
		</React.Fragment>
	);
}

function renderRequest(node: RequestNode, depth: number) {
	return (
		<option value={node.id} key={node.id}>
			{`${renderDepth(depth)}${node.name}`}
		</option>
	);
}

function renderDepth(depth: number) {
	return '\u00A0'.repeat(depth * 2);
}
