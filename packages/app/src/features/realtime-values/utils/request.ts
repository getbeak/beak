import type { RequestNode } from '@getbeak/types/nodes';
import type { Context } from '@getbeak/types/values';

export function getRequestNode(id: string, ctx: Context) {
	const node = ctx.projectTree[id];

	if (!node || node.type !== 'request' || node.mode !== 'valid')
		return null;

	return node as RequestNode;
}
