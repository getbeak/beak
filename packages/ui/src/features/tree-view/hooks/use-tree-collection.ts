import type { TreeCollection } from '@zag-js/collection';
import { collection as createTreeCollection } from '@zag-js/tree-view';
import { useMemo } from 'react';

import type { TreeViewItem, TreeViewNodes } from '../types';

export type BeakTreeNode = TreeViewItem & { children?: BeakTreeNode[] };

/**
 * A path is hidden when any path segment under `tree/` starts with `_`. The
 * `_`-prefix convention marks "managed metadata, don't put hand-authored
 * stuff in here" — schema sources live under `tree/_schemas/<kind>/<name>`,
 * `_collection.json` files live alongside requests, etc. The user can flip
 * the project-pane "Show schema sources" toggle to override this filter and
 * inspect the hidden subtree, but they won't see (or accidentally edit) it
 * by default.
 */
function isHidden(item: TreeViewItem): boolean {
	const filePath = item.filePath;
	if (!filePath) return false;
	const segments = filePath.split('/');
	// Skip the leading `tree` segment — only inner segments mark hidden.
	for (let i = 1; i < segments.length; i++) {
		if (segments[i]?.startsWith('_')) return true;
	}
	return false;
}

function sortByName(a: TreeViewItem, b: TreeViewItem) {
	return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Convert the renderer's flat `TreeViewNodes` dict into a Zag tree collection.
 * Folders sort above non-folders within each level; the synthetic 'root'
 * parent (which we use as an alias for the rootParentName) and a null parent
 * both resolve to the project root.
 *
 * `showHidden` lets the caller bypass the `_`-prefixed-segment filter so the
 * user can inspect the managed-metadata subtree (schema sources, etc.).
 */
function buildNested(tree: TreeViewNodes, rootParentName: string, showHidden: boolean): BeakTreeNode {
	const byParent = new Map<string, TreeViewItem[]>();
	for (const item of Object.values(tree)) {
		if (!showHidden && isHidden(item)) continue;
		const rawParent = item.parent;
		const parentKey = rawParent === 'root' || rawParent == null ? rootParentName : rawParent;
		if (!byParent.has(parentKey)) byParent.set(parentKey, []);
		byParent.get(parentKey)!.push(item);
	}

	const build = (parentKey: string): BeakTreeNode[] => {
		const kids = byParent.get(parentKey) ?? [];
		const sorted = [...kids].sort(sortByName);
		const folders = sorted.filter(c => c.type === 'folder');
		const others = sorted.filter(c => c.type !== 'folder');
		const out: BeakTreeNode[] = [];
		for (const folder of folders) out.push({ ...folder, children: build(folder.filePath) });
		for (const other of others) out.push({ ...other });
		return out;
	};

	return {
		id: 'root',
		type: 'folder',
		name: '',
		filePath: rootParentName,
		parent: null,
		children: build(rootParentName),
	};
}

export default function useTreeCollection(
	tree: TreeViewNodes,
	rootParentName: string,
	showHidden = false,
): TreeCollection<BeakTreeNode> {
	return useMemo(
		() =>
			createTreeCollection<BeakTreeNode>({
				rootNode: buildNested(tree, rootParentName, showHidden),
				nodeToValue: n => n.id,
				nodeToString: n => n.name,
				nodeToChildren: n => n.children ?? [],
				// Zag's `isBranchNode` falls back to `children.length > 0` unless
				// childrenCount is non-null. Return 0 for *every* folder so empty
				// folders still register as branches — the chevron column stays
				// aligned and an empty folder looks like (and can be expanded
				// from) a folder, not a leaf.
				nodeToChildrenCount: n => (n.type === 'folder' ? (n.children?.length ?? 0) : undefined),
			}),
		[tree, rootParentName, showHidden],
	);
}
