import type { WorkflowNode } from './types';

/**
 * Deep-clone a workflow node's `data` field using a JSON round-trip.
 *
 * Workflow node data is always JSON-safe (per the schema), so
 * `JSON.parse(JSON.stringify(…))` is correct here. `structuredClone`
 * chokes on Immer draft proxies, so we intentionally avoid it.
 *
 * Pure — no side-effects, no global state.
 */
export function deepCloneNodeData<T extends WorkflowNode>(
	source: T,
	newId: string,
	position: { x: number; y: number },
): T {
	return {
		...source,
		id: newId,
		position,
		data: JSON.parse(JSON.stringify(source.data)),
	} as T;
}
