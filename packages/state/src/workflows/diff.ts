import type { WorkflowFile } from './types';

/**
 * Pure diff between two snapshots of the same workflow. Used by the
 * future "what changed since last save" UI, by tests that need to assert
 * "an edit only touched X", and by the simulator to know if a re-run is
 * needed.
 *
 * `nodesModified` includes only nodes whose `data` / `position` /
 * `type` differs — pure-identity changes (the same node, structurally
 * equal) aren't reported. Identity is checked via JSON.stringify with
 * stable key order (good enough for a graph of plain objects).
 */
export interface WorkflowDiff {
	addedNodes: string[];
	removedNodes: string[];
	modifiedNodes: string[];
	addedEdges: string[];
	removedEdges: string[];
	modifiedEdges: string[];
	nameChanged: boolean;
	parentChanged: boolean;
}

export function diffWorkflows(before: WorkflowFile, after: WorkflowFile): WorkflowDiff {
	const beforeNodes = new Map(before.nodes.map(n => [n.id, n]));
	const afterNodes = new Map(after.nodes.map(n => [n.id, n]));
	const beforeEdges = new Map(before.edges.map(e => [e.id, e]));
	const afterEdges = new Map(after.edges.map(e => [e.id, e]));

	const addedNodes: string[] = [];
	const removedNodes: string[] = [];
	const modifiedNodes: string[] = [];
	for (const [id, node] of afterNodes) {
		const prev = beforeNodes.get(id);
		if (!prev) addedNodes.push(id);
		else if (!structurallyEqual(prev, node)) modifiedNodes.push(id);
	}
	for (const id of beforeNodes.keys()) {
		if (!afterNodes.has(id)) removedNodes.push(id);
	}

	const addedEdges: string[] = [];
	const removedEdges: string[] = [];
	const modifiedEdges: string[] = [];
	for (const [id, edge] of afterEdges) {
		const prev = beforeEdges.get(id);
		if (!prev) addedEdges.push(id);
		else if (!structurallyEqual(prev, edge)) modifiedEdges.push(id);
	}
	for (const id of beforeEdges.keys()) {
		if (!afterEdges.has(id)) removedEdges.push(id);
	}

	return {
		addedNodes: addedNodes.sort(),
		removedNodes: removedNodes.sort(),
		modifiedNodes: modifiedNodes.sort(),
		addedEdges: addedEdges.sort(),
		removedEdges: removedEdges.sort(),
		modifiedEdges: modifiedEdges.sort(),
		nameChanged: before.name !== after.name,
		parentChanged: (before.parent ?? null) !== (after.parent ?? null),
	};
}

function structurallyEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	return stableStringify(a) === stableStringify(b);
}

/**
 * Stable JSON.stringify — sorts object keys alphabetically before
 * stringifying so two objects with the same key/value pairs in
 * different insertion order compare equal. Arrays keep their order
 * (that's semantic for nodes / edges).
 */
function stableStringify(value: unknown): string {
	if (value === null || typeof value !== 'object') return JSON.stringify(value);
	if (Array.isArray(value)) return `[${value.map(v => stableStringify(v)).join(',')}]`;
	const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
	return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}
