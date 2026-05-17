import { previewValueSections } from './helpers';
import type { WorkflowFile, WorkflowNode } from './types';

/**
 * Pure helper that renders a workflow as readable Markdown — useful for
 * pasting into PR descriptions, docs, or bug reports. The output is a
 * single Markdown string with sections for steps + connections.
 *
 * Optionally accepts a `requestNames` map (id → display name) so request
 * nodes show the linked request's name instead of "Request step". The
 * renderer doesn't fetch this — the caller (`@beak/ui`) hands it in via
 * the project tree.
 */
export function toMarkdown(workflow: WorkflowFile, requestNames: ReadonlyMap<string, string> = new Map()): string {
	const lines: string[] = [];
	const title = workflow.name || 'Untitled workflow';
	lines.push(`# ${title}`, '');

	if (workflow.tags && workflow.tags.length > 0) {
		// Render as inline-code chips so the tags pop visually in a PR body
		// or README without depending on a custom markdown extension.
		lines.push(workflow.tags.map(t => `\`${t}\``).join(' · '), '');
	}

	if (workflow.description?.trim()) {
		lines.push(workflow.description.trim(), '');
	}

	if (workflow.nodes.length === 0) {
		lines.push('_Empty workflow._');
		return lines.join('\n');
	}

	lines.push('## Steps', '');
	for (const node of workflow.nodes) {
		lines.push(`- **${kindBadge(node.type)}** — ${describeNode(node, requestNames)}`);
	}

	if (workflow.edges.length > 0) {
		lines.push('', '## Connections', '');
		const labelFor = (id: string) => {
			const node = workflow.nodes.find(n => n.id === id);
			if (!node) return `(missing ${id.slice(0, 6)})`;
			return describeNode(node, requestNames);
		};
		for (const edge of workflow.edges) {
			const fromLabel = labelFor(edge.source);
			const toLabel = labelFor(edge.target);
			const handle = edge.sourceHandle ? ` (${edge.sourceHandle})` : '';
			const label = edge.label ? ` — _${edge.label}_` : '';
			lines.push(`- ${fromLabel}${handle} → ${toLabel}${label}`);
		}
	}

	return lines.join('\n');
}

function kindBadge(kind: WorkflowNode['type']): string {
	switch (kind) {
		case 'start':
			return 'Start';
		case 'request':
			return 'Request';
		case 'loop':
			return 'Loop';
		case 'condition':
			return 'If';
		case 'notification':
			return 'Notify';
		case 'comment':
			return 'Note';
	}
}

function describeNode(node: WorkflowNode, requestNames: ReadonlyMap<string, string>): string {
	const explicit = (node as { name?: string }).name?.trim();
	if (explicit) return explicit;
	switch (node.type) {
		case 'start':
			return 'Workflow entry point';
		case 'request': {
			const d = node.data as { requestId: string | null };
			if (!d.requestId) return '_(no linked request)_';
			return requestNames.get(d.requestId) ?? `request \`${d.requestId.slice(0, 8)}…\``;
		}
		case 'loop': {
			const d = node.data as { mode: 'count' | 'forEach'; count?: number };
			return d.mode === 'count' ? `repeat ${d.count ?? 0} ×` : 'for each item';
		}
		case 'condition': {
			const d = node.data as { operator?: string; leftPath?: string };
			const left = d.leftPath ? `\`$.${d.leftPath}\`` : 'incoming value';
			return `if ${left} ${d.operator ?? 'truthy'}`;
		}
		case 'notification': {
			const d = node.data as { title?: unknown[] };
			const title = previewValueSections(d.title) || 'Untitled';
			return `"${title}"`;
		}
		case 'comment': {
			const d = node.data as { text?: string };
			const text = (d.text ?? '').trim();
			return text || '_(empty note)_';
		}
	}
}
