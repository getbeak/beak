/**
 * Pending-rename registry — suppress fs-watcher churn during renderer-
 * initiated renames.
 *
 * Renaming a file or folder on disk shows up to the chokidar-backed
 * tree watcher as `unlink(oldPath)` + `add(newPath)` (and a fan-out of
 * the same pair for every descendant of a renamed folder). The default
 * orchestration of those events would close the open tab, drop the
 * node from the tree, then re-insert and re-open it — visible as a
 * brief flash on every rename.
 *
 * Renderer-initiated renames optimistically update the tree *before*
 * the disk move and register the expected path events here. The tree-
 * event handler consults these helpers and drops the events it can
 * account for, leaving the tab mounted throughout.
 *
 * Entries auto-expire after `EXPIRY_MS` so an unexpected fs hiccup
 * can't silently swallow real subsequent events.
 */

import type { Tree } from '@getbeak/types/nodes';

const EXPIRY_MS = 5000;

interface PendingRename {
	expectedRemove: Set<string>;
	expectedAdd: Set<string>;
	// Folder renames also suppress descendant churn by prefix — child
	// `_collection.json` events aren't tracked individually but still
	// arrive under one of these prefixes.
	suppressPrefixes: string[];
	expiresAt: number;
}

const pending = new Set<PendingRename>();

function purgeExpired() {
	const now = Date.now();
	for (const entry of pending) if (entry.expiresAt <= now) pending.delete(entry);
}

export function registerRequestRename(oldPath: string, newPath: string) {
	purgeExpired();
	pending.add({
		expectedRemove: new Set([oldPath]),
		expectedAdd: new Set([newPath]),
		suppressPrefixes: [],
		expiresAt: Date.now() + EXPIRY_MS,
	});
}

export function registerFolderRename(tree: Tree, oldFolder: string, newFolder: string) {
	purgeExpired();
	const oldPrefix = `${oldFolder}/`;
	const newPrefix = `${newFolder}/`;
	const expectedRemove = new Set<string>([oldFolder]);
	const expectedAdd = new Set<string>([newFolder]);

	for (const node of Object.values(tree)) {
		if (node.filePath === oldFolder) continue;
		if (!node.filePath.startsWith(oldPrefix)) continue;
		const suffix = node.filePath.slice(oldPrefix.length);
		expectedRemove.add(node.filePath);
		expectedAdd.add(newPrefix + suffix);
	}

	pending.add({
		expectedRemove,
		expectedAdd,
		suppressPrefixes: [oldPrefix, newPrefix],
		expiresAt: Date.now() + EXPIRY_MS,
	});
}

export function consumeRemoveEvent(eventPath: string): boolean {
	purgeExpired();
	for (const entry of pending) {
		if (entry.expectedRemove.delete(eventPath)) return true;
		for (const prefix of entry.suppressPrefixes) if (eventPath.startsWith(prefix)) return true;
	}
	return false;
}

export function consumeAddEvent(eventPath: string): boolean {
	purgeExpired();
	for (const entry of pending) {
		if (entry.expectedAdd.delete(eventPath)) return true;
		for (const prefix of entry.suppressPrefixes) if (eventPath.startsWith(prefix)) return true;
	}
	return false;
}
