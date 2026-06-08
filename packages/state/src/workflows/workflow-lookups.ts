import type { WorkflowFile } from './types';
import type { GraphHealth } from './workflow-graph-analysis';

export interface RequestUsage {
	workflowId: string;
	nodeId: string;
}

/**
 * Find every workflow request step that references the given project
 * request id. Returns `{ workflowId, nodeId }[]` so the caller can
 * jump straight to a usage. Useful for a tree-level "this request is
 * referenced by N workflows" indicator and for safe-rename / safe-
 * delete prompts before a request goes away.
 */
export function findRequestStepsUsing(
	workflows: ReadonlyArray<WorkflowFile> | Record<string, WorkflowFile>,
	requestId: string,
): RequestUsage[] {
	const list = Array.isArray(workflows) ? workflows : Object.values(workflows);
	const usages: RequestUsage[] = [];
	for (const wf of list) {
		for (const node of wf.nodes) {
			if (node.type !== 'request') continue;
			const d = node.data as { requestId: string | null };
			if (d.requestId === requestId) usages.push({ workflowId: wf.id, nodeId: node.id });
		}
	}
	return usages;
}

/**
 * Bucket workflows by their `parent` folder id. Workflows with no
 * parent fall under the empty-string bucket so callers can render
 * "Root" / "Untagged"-equivalent groups. Returns a Map keyed by parent
 * id (with root first by convention) — iteration order is stable as
 * long as the caller renders parents in insertion order.
 */
export function groupWorkflowsByParent(
	workflows: ReadonlyArray<WorkflowFile> | Record<string, WorkflowFile>,
): Map<string, WorkflowFile[]> {
	const list = Array.isArray(workflows) ? workflows : Object.values(workflows);
	const out = new Map<string, WorkflowFile[]>();
	const root: WorkflowFile[] = [];
	const nestedKeys: string[] = [];
	const buckets = new Map<string, WorkflowFile[]>();
	for (const wf of list) {
		const parent = (wf.parent ?? '').trim();
		if (parent === '') {
			root.push(wf);
			continue;
		}
		const bucket = buckets.get(parent);
		if (!bucket) {
			buckets.set(parent, [wf]);
			nestedKeys.push(parent);
		} else {
			bucket.push(wf);
		}
	}
	if (root.length > 0) out.set('', root);
	for (const key of nestedKeys) {
		out.set(key, buckets.get(key)!);
	}
	return out;
}

/**
 * Find a workflow by its display name. Case-insensitive, whitespace-
 * trimmed. Returns the first match — duplicate names can exist (the
 * conflict-suffix is best-effort, not enforced at the slice), so the
 * caller should not assume uniqueness. Returns null when nothing
 * matches; pure + cheap so safe to call from React renders.
 */
export function findWorkflowByName(
	workflows: Record<string, WorkflowFile> | ReadonlyArray<WorkflowFile>,
	name: string,
): WorkflowFile | null {
	const list = Array.isArray(workflows) ? (workflows as readonly WorkflowFile[]) : Object.values(workflows);
	const needle = name.trim().toLowerCase();
	if (needle === '') return null;
	for (const wf of list) {
		if ((wf.name ?? '').trim().toLowerCase() === needle) return wf;
	}
	return null;
}

/**
 * Returns `base` if it's not already in `existing`, otherwise appends a
 * " (2)", " (3)"… suffix until a unique name is found. The comparison is
 * case-insensitive so "Copy of Auth" and "COPY OF AUTH" don't both squeeze
 * through; the original casing of `base` is preserved in the returned name.
 */
export function uniqueWorkflowName(base: string, existing: ReadonlyArray<string>): string {
	const taken = new Set(existing.map(n => n.trim().toLowerCase()));
	if (!taken.has(base.trim().toLowerCase())) return base;
	for (let counter = 2; counter < 1000; counter += 1) {
		const candidate = `${base} (${counter})`;
		if (!taken.has(candidate.trim().toLowerCase())) return candidate;
	}
	return `${base} (${Date.now()})`;
}

/**
 * Sort a workflow collection by updatedAt descending. Workflows without
 * a timestamp (legacy files pre-dating the field) land last in their
 * insertion order so they don't shuffle on every open.
 *
 * Optional `limit` truncates the result — useful for "5 most recent"
 * surfaces. Accepts an array or a record (id → workflow).
 */
export function recentWorkflows(
	workflows: ReadonlyArray<WorkflowFile> | Record<string, WorkflowFile>,
	limit?: number,
): WorkflowFile[] {
	const list = Array.isArray(workflows) ? workflows.slice() : Object.values(workflows);
	list.sort((a, b) => {
		const ta = a.updatedAt;
		const tb = b.updatedAt;
		if (ta === undefined && tb === undefined) return 0;
		if (ta === undefined) return 1;
		if (tb === undefined) return -1;
		return tb - ta;
	});
	if (limit !== undefined) return list.slice(0, limit);
	return list;
}

/**
 * Number on [0, 1] representing how many of the workflow's request
 * nodes have a linked request id. Returns 1 (everything linked) when
 * the workflow has no request nodes at all — a "vacuous truth" so a
 * progress bar reads "complete" rather than "0%" for non-request
 * flows. Useful for a tree-row progress chip or a project-home
 * "ready to run" indicator.
 */
export function completionRatio(workflow: WorkflowFile): number {
	let total = 0;
	let linked = 0;
	for (const node of workflow.nodes) {
		if (node.type !== 'request') continue;
		total += 1;
		const d = node.data as { requestId: string | null };
		if (d.requestId) linked += 1;
	}
	if (total === 0) return 1;
	return linked / total;
}

/**
 * Distinct request ids referenced by the workflow's request nodes.
 * Returns the ids in first-appearance order so the caller can render
 * a "this workflow uses these requests" list with a stable layout.
 */
export function linkedRequestIds(workflow: WorkflowFile): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const node of workflow.nodes) {
		if (node.type !== 'request') continue;
		const d = node.data as { requestId: string | null };
		if (!d.requestId) continue;
		if (seen.has(d.requestId)) continue;
		seen.add(d.requestId);
		out.push(d.requestId);
	}
	return out;
}

/**
 * Distinct parent folder ids used across a collection of workflows.
 * Excludes the unset / blank parents (root-level workflows). Sorted
 * for deterministic output.
 */
export function parentIdsUsed(workflows: ReadonlyArray<WorkflowFile> | Record<string, WorkflowFile>): string[] {
	const list = Array.isArray(workflows) ? workflows : Object.values(workflows);
	const set = new Set<string>();
	for (const wf of list) {
		const parent = (wf.parent ?? '').trim();
		if (parent === '') continue;
		set.add(parent);
	}
	return [...set].sort();
}

/**
 * Returns the first request node id in the workflow whose `requestId`
 * is null, scanning in insertion order. Used by quick-fix flows to
 * jump straight to the most pressing "unlinked request" without
 * walking every node. Returns null when nothing's unlinked.
 */
export function firstUnlinkedRequest(workflow: WorkflowFile): string | null {
	for (const node of workflow.nodes) {
		if (node.type !== 'request') continue;
		const d = node.data as { requestId: string | null };
		if (!d.requestId) return node.id;
	}
	return null;
}

/**
 * Find workflows whose display name collides (case-insensitive,
 * whitespace-trimmed) — used by a future "Project doctor" pane to
 * flag accidental duplicates introduced by paste-import or by the
 * conflict-suffix walker failing past 1000 iterations.
 *
 * Returns one entry per name with the colliding workflow ids; entries
 * with only one workflow are omitted. Sorted by name for stable diffs.
 */
export function findDuplicateNames(
	workflows: ReadonlyArray<WorkflowFile> | Record<string, WorkflowFile>,
): Array<{ name: string; ids: string[] }> {
	const list = Array.isArray(workflows) ? workflows : Object.values(workflows);
	const buckets = new Map<string, { display: string; ids: string[] }>();
	for (const wf of list) {
		const display = (wf.name ?? '').trim();
		if (display === '') continue;
		const key = display.toLowerCase();
		const bucket = buckets.get(key) ?? { display, ids: [] as string[] };
		bucket.ids.push(wf.id);
		buckets.set(key, bucket);
	}
	const out: Array<{ name: string; ids: string[] }> = [];
	for (const { display, ids } of buckets.values()) {
		if (ids.length < 2) continue;
		out.push({ name: display, ids: [...ids] });
	}
	out.sort((a, b) => a.name.localeCompare(b.name));
	return out;
}

/**
 * One-line human summary of a workflow's structural issues. Returns
 * `null` when everything is clean so the caller can skip rendering the
 * line entirely. The output is comma-separated and prefixes counts —
 * "1 unreachable, 2 cycle members, 3 unlinked requests, 2 warnings" —
 * stable enough to use in a tooltip, the Markdown export, or a
 * notification toast.
 */
export function summariseHealth(health: GraphHealth, warningCount: number): string | null {
	const parts: string[] = [];
	if (health.unreachable.length > 0) {
		const n = health.unreachable.length;
		parts.push(`${n} unreachable`);
	}
	if (health.cycleNodes.length > 0) {
		const n = health.cycleNodes.length;
		parts.push(`${n} cycle member${n === 1 ? '' : 's'}`);
	}
	if (health.unlinkedRequestNodes.length > 0) {
		const n = health.unlinkedRequestNodes.length;
		parts.push(`${n} unlinked request${n === 1 ? '' : 's'}`);
	}
	if (warningCount > 0) {
		parts.push(`${warningCount} warning${warningCount === 1 ? '' : 's'}`);
	}
	if (parts.length === 0) return null;
	return parts.join(', ');
}
