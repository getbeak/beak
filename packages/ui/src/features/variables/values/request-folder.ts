import { Variable } from '@getbeak/types-variables';

const definition: Variable<any> = {
	type: 'request_folder',
	name: 'Request folder',
	description: 'Returns the name of the folder the request is inside',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => void 0,

	getValue: async ctx => {
		const node = ctx.projectTree[ctx.currentRequestId!];

		if (!node || node.type !== 'request' || node.mode !== 'valid')
			return '';

		const parentNode = ctx.projectTree[node.parent!];

		if (!parentNode || parentNode.type !== 'folder')
			return '';

		return parentNode.name;
	},

	attributes: {
		requiresRequestId: true,
	},
};

export default definition;
