import type { Variable } from '@getbeak/extension-sdk';

const definition: Variable<any> = {
	type: 'request_folder',
	name: 'Request folder',
	description: 'Returns the name of the folder the request is inside',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => void 0,

	resolve: async ({ variableContext: ctx }) => {
		const node = ctx.projectTree[ctx.currentRequestId!];

		if (!node || node.type !== 'request' || node.mode !== 'valid') return { kind: 'text', text: '' };

		const parentNode = ctx.projectTree[node.parent!];

		if (!parentNode || parentNode.type !== 'folder') return { kind: 'text', text: '' };

		return { kind: 'text', text: parentNode.name };
	},

	attributes: {
		requiresRequestId: true,
	},
};

export default definition;
