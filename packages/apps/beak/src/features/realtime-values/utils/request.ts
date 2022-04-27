import { RequestNode } from '@beak/shared-common/types/beak-project';

import { Context } from '../types';

export function getRequestNode(id: string, ctx: Context) {
	const node = ctx.projectTree[id];

	if (!node || node.type !== 'request' || node.mode !== 'valid')
		return null;

	return node as RequestNode;
}
