import type { FolderNode, Tree } from '@getbeak/types/nodes';

// ---------------------------------------------------------------------------
// Pure helpers for project tree mutations (ADR 0005 §4)
//
// These functions take their inputs as parameters and return new values —
// no closures over slice state, no side-effects.

/**
 * Returns the final path segment of `p` (everything after the last `/`).
 * When there is no slash the whole string is returned.
 */
export function basename(p: string): string {
	const slash = p.lastIndexOf('/');
	return slash >= 0 ? p.slice(slash + 1) : p;
}

/**
 * Re-home a folder under `newPath`, rewriting every descendant's
 * `filePath` and `parent`. Folder descendants are re-keyed (folders are
 * tree-keyed by filePath); requests stay keyed by ksuid.
 *
 * Used by both folder rename and folder move — same path-rewrite
 * mechanics, the caller decides what `newPath` is.
 *
 * Mutates `tree` entries in place (Immer-safe within a reducer) and
 * returns the new tree object.
 */
export function rewriteFolderTreePaths(tree: Tree, folder: FolderNode, newPath: string): Tree {
	const oldPath = folder.filePath;
	if (newPath === oldPath) return tree;

	const oldPrefix = `${oldPath}/`;
	const newPrefix = `${newPath}/`;

	const next = {} as Tree;
	for (const [key, child] of Object.entries(tree)) {
		if (child === folder) continue; // re-inserted by caller
		if (child.filePath === oldPath) continue; // duplicate of `folder`

		if (child.filePath.startsWith(oldPrefix)) {
			child.filePath = newPrefix + child.filePath.slice(oldPrefix.length);
			if (child.parent === oldPath) {
				child.parent = newPath;
			} else if (child.parent && child.parent.startsWith(oldPrefix)) {
				child.parent = newPrefix + child.parent.slice(oldPrefix.length);
			}
			next[child.type === 'folder' ? child.filePath : key] = child;
			continue;
		}

		next[key] = child;
	}

	folder.filePath = newPath;
	folder.id = newPath;
	next[newPath] = folder;
	return next;
}

/**
 * Rename a folder node to `newName` within the tree.
 *
 * Derives the new path from the folder's current path (replacing the final
 * segment with `newName`) and delegates all descendant rewriting to
 * `rewriteFolderTreePaths`.
 *
 * Returns the updated tree (or the original tree if the new name produces
 * the same path as before).
 */
export function renameFolderInTree(tree: Tree, folder: FolderNode, newName: string): Tree {
	folder.name = newName;
	const oldPath = folder.filePath;
	const slash = oldPath.lastIndexOf('/');
	const dir = slash >= 0 ? oldPath.slice(0, slash) : '';
	const newPath = dir ? `${dir}/${newName}` : newName;
	return rewriteFolderTreePaths(tree, folder, newPath);
}

/**
 * Move a folder node into a new parent folder.
 *
 * Sets the folder's `parent` to `destinationFolderPath` and re-keys the
 * folder (and all its descendants) under the new path via
 * `rewriteFolderTreePaths`.
 *
 * Returns the updated tree (or the original tree if the computed new path
 * matches the folder's existing path).
 */
export function moveFolderInTree(tree: Tree, folder: FolderNode, destinationFolderPath: string): Tree {
	folder.parent = destinationFolderPath;
	const newPath = `${destinationFolderPath}/${basename(folder.filePath)}`;
	return rewriteFolderTreePaths(tree, folder, newPath);
}
