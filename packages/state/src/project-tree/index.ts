import type { FolderNode, Nodes, RequestNode, Tree } from '@getbeak/types/nodes';

/**
 * Pure helpers for walking the project tree.
 *
 * The tree is stored as a flat `Record<id, Node>` with each node carrying
 * a `parent` pointer. Most consumers want to filter by type, find a
 * folder by its path, enumerate descendants of a given parent, or walk
 * the parent chain back to the root. Doing that with `Object.values(...)
 * .filter(...)` and `n.parentId === ...` ad-hoc invites the kind of
 * subtle drift the audit found (e.g. `JsonEditor.findRoot` forgetting
 * the enabled-check).
 *
 * All functions are O(n) over the full tree and pure — they don't
 * depend on Redux, don't memoise, don't allocate beyond their result.
 * Callers that need memoisation should do it at the selector layer.
 */

type NodeOfType<T extends Nodes['type']> = Extract<Nodes, { type: T }>;

/**
 * Find a folder by its project-relative `filePath` (e.g. `tree/users`).
 * Returns `undefined` when no folder with that path exists. Path
 * normalisation is the caller's responsibility — exact string match.
 */
export function findFolderByPath(tree: Tree, filePath: string): FolderNode | undefined {
	for (const node of Object.values(tree)) {
		if (node.type === 'folder' && node.filePath === filePath) return node;
	}
	return undefined;
}

/**
 * Return every direct child of `parentId`. Pass `type` to constrain the
 * result (e.g. `'folder'` for sub-folders only). Children are returned
 * in insertion order; callers that need a stable sort do it themselves.
 */
export function findChildren<T extends Nodes['type']>(tree: Tree, parentId: string, type: T): NodeOfType<T>[];
export function findChildren(tree: Tree, parentId: string): Nodes[];
export function findChildren(tree: Tree, parentId: string, type?: Nodes['type']): Nodes[] {
	const out: Nodes[] = [];
	for (const node of Object.values(tree)) {
		if (node.parent !== parentId) continue;
		if (type && node.type !== type) continue;
		out.push(node);
	}
	return out;
}

/**
 * Return every descendant of `rootId` (depth-first, ancestor-then-children).
 * The root itself is NOT included — callers that want it should prepend
 * it themselves. `type` filters the result without changing the walk
 * order: descendants of unmatched folders are still visited.
 */
export function findDescendants<T extends Nodes['type']>(tree: Tree, rootId: string, type: T): NodeOfType<T>[];
export function findDescendants(tree: Tree, rootId: string): Nodes[];
export function findDescendants(tree: Tree, rootId: string, type?: Nodes['type']): Nodes[] {
	// Index children once so the recursive walk is O(n) rather than
	// O(n * depth). A single pass through the tree builds a parent → children
	// map; the walk then just follows references.
	const childrenByParent: Record<string, Nodes[]> = {};
	for (const node of Object.values(tree)) {
		const key = node.parent ?? '';
		(childrenByParent[key] ??= []).push(node);
	}
	const out: Nodes[] = [];
	const stack: string[] = [rootId];
	const visited = new Set<string>();
	while (stack.length > 0) {
		const current = stack.pop()!;
		const kids = childrenByParent[current] ?? [];
		// Push in reverse so DFS preserves declaration order.
		for (let i = kids.length - 1; i >= 0; i--) {
			const child = kids[i]!;
			if (visited.has(child.id)) continue;
			visited.add(child.id);
			if (!type || child.type === type) out.push(child);
			stack.push(child.id);
		}
	}
	return out;
}

/**
 * Walk back to the root: returns ancestors from immediate parent up to
 * (but not including) the synthetic null root. The starting node itself
 * is NOT included. Empty array when `nodeId` is unknown or is a top-level
 * node with no parent.
 */
export function getParentChain(tree: Tree, nodeId: string): Nodes[] {
	const out: Nodes[] = [];
	let cursor: string | null = tree[nodeId]?.parent ?? null;
	const visited = new Set<string>();
	while (cursor && !visited.has(cursor)) {
		visited.add(cursor);
		const parent = tree[cursor];
		if (!parent) break;
		out.push(parent);
		cursor = parent.parent;
	}
	return out;
}

/**
 * Filter every node in the tree by type. Type-safe overload — passing
 * `'folder'` narrows the return to `FolderNode[]`, `'request'` to
 * `RequestNode[]`.
 */
export function filterByType(tree: Tree, type: 'folder'): FolderNode[];
export function filterByType(tree: Tree, type: 'request'): RequestNode[];
export function filterByType(tree: Tree, type: Nodes['type']): Nodes[] {
	const out: Nodes[] = [];
	for (const node of Object.values(tree)) {
		if (node.type === type) out.push(node);
	}
	return out;
}
