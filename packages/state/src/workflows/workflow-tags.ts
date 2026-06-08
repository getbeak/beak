import type { WorkflowFile } from './types';

/**
 * Flatten + dedupe tags across a workflow map. Returns them in
 * alphabetical order so downstream UI (autocomplete, filter chips)
 * gets a stable listing. Pure; ready for tree-filter machinery.
 */
export function extractAllTags(workflows: ReadonlyArray<WorkflowFile> | Record<string, WorkflowFile>): string[] {
	const list = Array.isArray(workflows) ? workflows : Object.values(workflows);
	const set = new Set<string>();
	for (const wf of list) {
		for (const t of wf.tags ?? []) set.add(t);
	}
	return [...set].sort();
}

/**
 * Returns the count of distinct (deduped, normalised) tags across the
 * collection. Equivalent to `extractAllTags(workflows).length` but
 * skips the array allocation so it's safe to call from a tight
 * render path (eg. tab chip badges).
 */
export function tagCount(workflows: ReadonlyArray<WorkflowFile> | Record<string, WorkflowFile>): number {
	const list = Array.isArray(workflows) ? workflows : Object.values(workflows);
	const set = new Set<string>();
	for (const wf of list) {
		for (const t of wf.tags ?? []) set.add(t);
	}
	return set.size;
}

/**
 * Tags that appear in `known` but never on any workflow in `workflows`.
 * Useful when the project tracks a curated tag vocabulary (eg. read from
 * project.json) and we want to flag stale entries. Returns the tags
 * sorted so the output is deterministic for diffs / UI snapshots.
 */
export function unusedTags(
	workflows: ReadonlyArray<WorkflowFile> | Record<string, WorkflowFile>,
	known: ReadonlyArray<string>,
): string[] {
	const inUse = new Set(extractAllTags(workflows));
	const seen = new Set<string>();
	const out: string[] = [];
	for (const raw of known) {
		const tag = raw.trim().toLowerCase();
		if (!tag) continue;
		if (inUse.has(tag)) continue;
		if (seen.has(tag)) continue;
		seen.add(tag);
		out.push(tag);
	}
	return out.sort();
}

/**
 * Bucket workflows by tag — used by the (future) tag-filter chip bar in
 * the project pane. Workflows with no tags fall into the empty-string
 * bucket so the caller can choose whether to show an "Untagged" group.
 * Returns a Map so insertion order is the tag alphabetical order from
 * extractAllTags + a trailing untagged bucket when present.
 */
export function workflowsByTag(
	workflows: ReadonlyArray<WorkflowFile> | Record<string, WorkflowFile>,
): Map<string, WorkflowFile[]> {
	const list = Array.isArray(workflows) ? workflows : Object.values(workflows);
	const tags = extractAllTags(list);
	const out = new Map<string, WorkflowFile[]>();
	for (const tag of tags) out.set(tag, []);
	const untagged: WorkflowFile[] = [];
	for (const wf of list) {
		const wfTags = wf.tags ?? [];
		if (wfTags.length === 0) {
			untagged.push(wf);
			continue;
		}
		for (const t of wfTags) {
			out.get(t)!.push(wf);
		}
	}
	if (untagged.length > 0) out.set('', untagged);
	return out;
}
