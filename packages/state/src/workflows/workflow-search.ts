import type { WorkflowFile, WorkflowNode } from './types';
import { previewValueSections } from './workflow-node-display';

/**
 * "just now" / "5m ago" / "2d ago" / "3mo ago" formatter. Single source
 * of truth for relative timestamps across the workflow surface — tree
 * tooltip, stats dialog, save-state indicator. Caller passes "now" so
 * the helper stays pure + deterministic.
 */
export function formatRelativeTime(ms: number, now: number = Date.now()): string {
	const seconds = Math.max(0, Math.floor((now - ms) / 1000));
	if (seconds < 60) return 'just now';
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	const months = Math.floor(days / 30);
	if (months < 12) return `${months}mo ago`;
	const years = Math.floor(months / 12);
	return `${years}y ago`;
}

export interface NodeSearchResult {
	id: string;
	label: string;
	subtitle: string;
	kind: WorkflowNode['type'];
}

/**
 * Search the workflow's nodes by free-text query — used by the editor's
 * Cmd-K node finder. The "label" is whatever the user would recognise:
 * the linked request's name for request nodes (resolved by the caller —
 * we get it via the `requestNames` lookup, since pure helpers don't see
 * the project tree), trimmed comment text for comment nodes, and the
 * node kind otherwise.
 *
 * Returns nodes whose label OR kind contains the query (case-insensitive),
 * sorted by match position (prefix > substring) and tie-broken by label.
 */
export function searchNodes(
	workflow: WorkflowFile,
	query: string,
	requestNames: ReadonlyMap<string, string>,
): NodeSearchResult[] {
	const all = workflow.nodes.map(n => describeNodeForSearch(n, requestNames));
	const trimmed = query.trim().toLowerCase();
	if (trimmed === '') return all;
	const scored: { item: NodeSearchResult; score: number }[] = [];
	for (const item of all) {
		const labelLower = item.label.toLowerCase();
		const kindLower = item.kind.toLowerCase();
		const labelIdx = labelLower.indexOf(trimmed);
		const kindIdx = kindLower.indexOf(trimmed);
		const subtitleIdx = item.subtitle.toLowerCase().indexOf(trimmed);
		const idLower = item.id.toLowerCase();
		const idIdx = idLower.indexOf(trimmed);
		// Prefer label-prefix > label-substring > kind-substring > subtitle-substring > id-substring.
		let score = -1;
		if (labelIdx === 0) score = 1000;
		else if (labelIdx > 0) score = 500 - labelIdx;
		else if (kindIdx >= 0) score = 200 - kindIdx;
		else if (subtitleIdx >= 0) score = 100 - subtitleIdx;
		else if (idIdx >= 0) score = 50 - idIdx;
		if (score < 0) continue;
		scored.push({ item, score });
	}
	scored.sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label));
	return scored.map(s => s.item);
}

function describeNodeForSearch(
	node: WorkflowNode,
	requestNames: ReadonlyMap<string, string>,
): NodeSearchResult {
	// A user-given `name` always wins over the derived label.
	const explicit = (node as { name?: string }).name?.trim();
	if (explicit) {
		return { id: node.id, label: explicit, subtitle: kindCapitalised(node.type), kind: node.type };
	}
	switch (node.type) {
		case 'start':
			return { id: node.id, label: 'Start', subtitle: 'Workflow entry point', kind: 'start' };
		case 'request': {
			const d = node.data as { requestId: string | null };
			const linked = d.requestId ? requestNames.get(d.requestId) : undefined;
			return {
				id: node.id,
				label: linked ?? 'Untitled request step',
				subtitle: linked ? 'Linked request' : 'No request linked',
				kind: 'request',
			};
		}
		case 'loop': {
			const d = node.data as { mode: 'count' | 'forEach'; count?: number };
			return {
				id: node.id,
				label: d.mode === 'count' ? `Loop ${d.count ?? 0}×` : 'Loop for each',
				subtitle: 'Loop',
				kind: 'loop',
			};
		}
		case 'condition': {
			const d = node.data as { operator?: string };
			return {
				id: node.id,
				label: `Condition (${d.operator ?? 'truthy'})`,
				subtitle: 'Condition',
				kind: 'condition',
			};
		}
		case 'notification': {
			const d = node.data as { title?: unknown[] };
			const title = previewValueSections(d.title) || 'Untitled notification';
			return { id: node.id, label: title, subtitle: 'Notification', kind: 'notification' };
		}
		case 'comment': {
			const d = node.data as { text?: string };
			const text = (d.text ?? '').trim();
			return {
				id: node.id,
				label: text || 'Empty note',
				subtitle: 'Comment',
				kind: 'comment',
			};
		}
	}
}

function kindCapitalised(kind: WorkflowNode['type']): string {
	return kind.charAt(0).toUpperCase() + kind.slice(1);
}

export interface WorkflowSearchResult {
	id: string;
	name: string;
	subtitle: string;
}

/**
 * Free-text fuzzy-ish search across a workflow collection — used by the
 * Cmd-K omni-bar and the project pane filter. Match rules, in order of
 * preference:
 *   - name prefix
 *   - name substring
 *   - tag exact
 *   - description substring
 *   - id substring (last-resort recovery for power users)
 * Returns every workflow with no match dropped. Sorted by score, ties
 * broken alphabetically by name so the list is stable across renders.
 * An empty query returns every entry in name order — same shape so the
 * caller can render unconditionally.
 */
export function searchWorkflows(
	workflows: Record<string, WorkflowFile> | readonly WorkflowFile[],
	query: string,
): WorkflowSearchResult[] {
	const list = Array.isArray(workflows) ? (workflows as readonly WorkflowFile[]) : Object.values(workflows);
	const trimmed = query.trim().toLowerCase();
	const items: WorkflowSearchResult[] = list.map(wf => ({
		id: wf.id,
		name: wf.name?.trim() || 'Untitled workflow',
		subtitle: composeWorkflowSubtitle(wf),
	}));
	if (trimmed === '') {
		return items.sort((a, b) => a.name.localeCompare(b.name));
	}
	const scored: { item: WorkflowSearchResult; score: number }[] = [];
	for (let i = 0; i < items.length; i += 1) {
		const wf = list[i];
		const item = items[i];
		const nameLower = item.name.toLowerCase();
		const descLower = (wf.description ?? '').toLowerCase();
		const idLower = item.id.toLowerCase();
		const nameIdx = nameLower.indexOf(trimmed);
		const descIdx = descLower.indexOf(trimmed);
		const idIdx = idLower.indexOf(trimmed);
		const tagHit = (wf.tags ?? []).some(t => t === trimmed);
		const tagSubHit = (wf.tags ?? []).some(t => t.indexOf(trimmed) >= 0);
		let score = -1;
		if (nameIdx === 0) score = 1000;
		else if (nameIdx > 0) score = 500 - nameIdx;
		else if (tagHit) score = 300;
		else if (tagSubHit) score = 200;
		else if (descIdx >= 0) score = 100 - descIdx;
		else if (idIdx >= 0) score = 50 - idIdx;
		if (score < 0) continue;
		scored.push({ item, score });
	}
	scored.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
	return scored.map(s => s.item);
}

function composeWorkflowSubtitle(wf: WorkflowFile): string {
	const parts: string[] = [];
	const desc = wf.description?.trim();
	if (desc) parts.push(desc);
	if (wf.tags && wf.tags.length > 0) parts.push(`#${wf.tags.join(' #')}`);
	return parts.join(' · ');
}
