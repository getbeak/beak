import type { WorkflowFile } from './types';
import { nodeBounds } from './workflow-layout';
import { uniqueWorkflowName } from './workflow-lookups';

/**
 * Clone a workflow file with fresh ids on the workflow + every node +
 * every edge. Names default to "Copy of <name>" — caller can override.
 * Resets createdAt/updatedAt so the clone reads as "made just now"
 * rather than inheriting the source's history.
 *
 * The caller supplies the id minter so the side-effect of generating
 * KSUIDs stays out of pure-helper land — same pattern as
 * `parseImportedWorkflow` and `instantiateTemplate`.
 */
export function duplicateWorkflow(
	source: WorkflowFile,
	mintId: (prefix: 'workflow' | 'node' | 'edge') => string,
	options: { name?: string; existingNames?: ReadonlyArray<string> } = {},
): WorkflowFile {
	const nodeIdMap = new Map<string, string>();
	const nodes = source.nodes.map(node => {
		const newId = mintId('node');
		nodeIdMap.set(node.id, newId);
		return { ...node, id: newId } as typeof node;
	});
	const edges = source.edges
		.filter(e => nodeIdMap.has(e.source) && nodeIdMap.has(e.target))
		.map(edge => ({
			...edge,
			id: mintId('edge'),
			source: nodeIdMap.get(edge.source)!,
			target: nodeIdMap.get(edge.target)!,
		}));
	const baseName = options.name ?? `Copy of ${source.name}`;
	const finalName = options.existingNames ? uniqueWorkflowName(baseName, options.existingNames) : baseName;
	return {
		...source,
		id: mintId('workflow'),
		name: finalName,
		nodes,
		edges,
		createdAt: undefined,
		updatedAt: undefined,
	};
}

/**
 * Pretty-print the workflow as JSON for clipboard export. The shape is
 * the on-disk schema verbatim — pasting it back via `parseImportedWorkflow`
 * produces an equivalent workflow with re-keyed ids.
 */
export function serializeForExport(workflow: WorkflowFile): string {
	return JSON.stringify(workflow, null, 2);
}

export interface ParseImportResult {
	ok: boolean;
	workflow?: WorkflowFile;
	reason?: string;
}

/**
 * Parse + re-id a workflow from clipboard JSON. The caller supplies an
 * id minter so the new workflow + its nodes / edges get fresh KSUIDs;
 * otherwise paste would collide with the source. Returns `{ ok: false }`
 * on parse error rather than throwing — the UI's paste flow surfaces
 * the reason in a toast.
 *
 * The actual Zod validation lives in the schema package; we accept the
 * shape loosely here and rely on the schema parse to enforce it.
 */
export function parseImportedWorkflow(
	json: string,
	mintId: (prefix: 'workflow' | 'node' | 'edge') => string,
	parseSchema: (raw: unknown) => WorkflowFile,
): ParseImportResult {
	let raw: unknown;
	try {
		raw = JSON.parse(json);
	} catch (err) {
		return { ok: false, reason: (err as Error).message };
	}
	let parsed: WorkflowFile;
	try {
		parsed = parseSchema(raw);
	} catch (err) {
		return { ok: false, reason: (err as Error).message };
	}
	// Re-key every id: workflow, every node, every edge (rewriting source/
	// target to the new node ids).
	const nodeIdMap = new Map<string, string>();
	const reKeyedNodes = parsed.nodes.map(node => {
		const newId = mintId('node');
		nodeIdMap.set(node.id, newId);
		return { ...node, id: newId };
	});
	const reKeyedEdges = parsed.edges.map(edge => ({
		...edge,
		id: mintId('edge'),
		source: nodeIdMap.get(edge.source) ?? edge.source,
		target: nodeIdMap.get(edge.target) ?? edge.target,
	}));
	const workflow: WorkflowFile = {
		...parsed,
		id: mintId('workflow'),
		nodes: reKeyedNodes,
		edges: reKeyedEdges,
	};
	return { ok: true, workflow };
}

/**
 * Graft `source`'s nodes + edges into `into` — used by paste-into-existing
 * and future "import partial". Re-keys every node/edge id via the
 * caller-supplied minter so there are no collisions; shifts source's
 * nodes to land to the right of `into`'s existing bounds with a margin.
 * The Start node from source is dropped (workflows already have one).
 *
 * Pure + deterministic given a stable minter. Doesn't touch tags /
 * description / name on `into`.
 */
export function mergeWorkflows(
	into: WorkflowFile,
	source: WorkflowFile,
	mintId: (prefix: 'node' | 'edge') => string,
): WorkflowFile {
	const intoBounds = nodeBounds(into.nodes);
	const sourceBounds = nodeBounds(source.nodes.filter(n => n.type !== 'start'));
	const xShift = intoBounds && sourceBounds ? intoBounds.maxX + 240 - sourceBounds.minX : 0;
	const yShift = intoBounds && sourceBounds ? intoBounds.minY - sourceBounds.minY : 0;

	const nodeIdMap = new Map<string, string>();
	const reKeyedNodes = source.nodes
		.filter(n => n.type !== 'start')
		.map(node => {
			const newId = mintId('node');
			nodeIdMap.set(node.id, newId);
			return {
				...node,
				id: newId,
				position: { x: node.position.x + xShift, y: node.position.y + yShift },
			};
		}) as typeof into.nodes;

	const reKeyedEdges = source.edges
		.filter(e => nodeIdMap.has(e.source) && nodeIdMap.has(e.target))
		.map(edge => ({
			...edge,
			id: mintId('edge'),
			source: nodeIdMap.get(edge.source)!,
			target: nodeIdMap.get(edge.target)!,
		}));

	return {
		...into,
		nodes: [...into.nodes, ...reKeyedNodes],
		edges: [...into.edges, ...reKeyedEdges],
	};
}
