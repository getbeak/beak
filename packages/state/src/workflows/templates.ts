import type { WorkflowFile, WorkflowNode } from './types';

/**
 * Starter templates for new workflows. Each template is a pure function:
 * the caller hands in an id minter (KSUID is a renderer-side side-effect,
 * which would leak into pure state if we minted in here) and a workflow
 * name; the template emits a seed `WorkflowFile` with nodes/edges already
 * wired and laid out.
 *
 * The catalog is open — adding a new template means a single entry in
 * `templates` and (if you want it offered in the picker) a metadata row
 * in `templateCatalog`.
 */

export type TemplateKey = 'blank' | 'smoke-test' | 'auth-chain' | 'paginated-fetch';

export interface TemplateMetadata {
	key: TemplateKey;
	title: string;
	subtitle: string;
}

/**
 * Pickable templates in the UI. `blank` is intentionally first (and the
 * default) — most users land here, hit New, and want an empty canvas.
 */
export const templateCatalog: TemplateMetadata[] = [
	{
		key: 'blank',
		title: 'Blank workflow',
		subtitle: 'A single Start node — add steps from scratch.',
	},
	{
		key: 'smoke-test',
		title: 'Smoke test',
		subtitle: 'One request followed by a notification — handy for a "did the API answer?" probe.',
	},
	{
		key: 'auth-chain',
		title: 'Auth chain',
		subtitle: 'Two linked requests — the first picks up a token, the second consumes it.',
	},
	{
		key: 'paginated-fetch',
		title: 'Paginated fetch',
		subtitle: 'Loop the same request N times — change page via the request override.',
	},
];

/**
 * Caller-supplied minter so KSUID's runtime side-effect stays out of
 * pure state. Tests pass a deterministic counter; the renderer passes
 * `() => ksuid.generate('node').toString()`.
 */
export type IdMinter = (prefix: 'workflow' | 'node' | 'edge') => string;

export interface InstantiateOptions {
	template: TemplateKey;
	name: string;
	parent?: string | null;
	mintId: IdMinter;
}

export function instantiateTemplate(options: InstantiateOptions): WorkflowFile {
	const { template, name, mintId } = options;
	const parent = options.parent ?? null;
	const workflowId = mintId('workflow');
	const startId = mintId('node');
	const startNode: WorkflowNode = { id: startId, type: 'start', position: { x: 80, y: 120 }, data: {} };

	switch (template) {
		case 'blank': {
			return { id: workflowId, name, parent, nodes: [startNode], edges: [] };
		}
		case 'smoke-test': {
			const requestId = mintId('node');
			const notifId = mintId('node');
			return {
				id: workflowId,
				name,
				parent,
				nodes: [
					startNode,
					{ id: requestId, type: 'request', position: { x: 360, y: 120 }, data: { requestId: null } },
					{
						id: notifId,
						type: 'notification',
						position: { x: 640, y: 120 },
						data: { title: ['Smoke test passed'], body: [] },
					},
				],
				edges: [
					{ id: mintId('edge'), source: startId, target: requestId },
					{ id: mintId('edge'), source: requestId, target: notifId },
				],
			};
		}
		case 'auth-chain': {
			const loginId = mintId('node');
			const callId = mintId('node');
			return {
				id: workflowId,
				name,
				parent,
				nodes: [
					startNode,
					{ id: loginId, type: 'request', position: { x: 360, y: 120 }, data: { requestId: null } },
					{ id: callId, type: 'request', position: { x: 640, y: 120 }, data: { requestId: null } },
				],
				edges: [
					{ id: mintId('edge'), source: startId, target: loginId },
					{ id: mintId('edge'), source: loginId, target: callId },
				],
			};
		}
		case 'paginated-fetch': {
			const loopId = mintId('node');
			const requestId = mintId('node');
			return {
				id: workflowId,
				name,
				parent,
				nodes: [
					startNode,
					{ id: loopId, type: 'loop', position: { x: 360, y: 120 }, data: { mode: 'count', count: 5 } },
					{ id: requestId, type: 'request', position: { x: 640, y: 120 }, data: { requestId: null } },
				],
				edges: [
					{ id: mintId('edge'), source: startId, target: loopId },
					{ id: mintId('edge'), source: loopId, target: requestId, sourceHandle: 'body' },
				],
			};
		}
	}
}
