import { Variable } from '@getbeak/types-variables';

const definition: Variable<any> = {
	type: 'request_name',
	name: 'Request name',
	description: 'Returns the name of the this request',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => void 0,

	getValue: async ctx => {
		const node = ctx.projectTree[ctx.currentRequestId!];

		if (!node || node.type !== 'request')
			return '';

		return node.name;
	},

	attributes: {
		requiresRequestId: true,
	},
};

export default definition;
