import type { Variable } from '@getbeak/extension-sdk';

const definition: Variable<any> = {
	type: 'request_method',
	name: 'Request method',
	description: 'Returns the HTTP method of this request',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => void 0,

	resolve: async ({ variableContext: ctx }) => {
		const node = ctx.projectTree[ctx.currentRequestId!];

		if (!node || node.type !== 'request' || node.mode !== 'valid') return { kind: 'text', text: '' };

		return { kind: 'text', text: node.info.verb.toUpperCase() };
	},

	attributes: {
		requiresRequestId: true,
	},
};

export default definition;
