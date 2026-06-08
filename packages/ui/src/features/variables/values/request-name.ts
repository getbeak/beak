import type { Variable } from '@getbeak/extension-sdk';

const definition: Variable<any> = {
	type: 'request_name',
	name: 'Request name',
	description: 'Returns the name of this request',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => void 0,

	resolve: async ({ variableContext: ctx }) => {
		const node = ctx.projectTree[ctx.currentRequestId!];

		if (!node || node.type !== 'request') return { kind: 'text', text: '' };

		return { kind: 'text', text: node.name };
	},

	attributes: {
		requiresRequestId: true,
	},
};

export default definition;
