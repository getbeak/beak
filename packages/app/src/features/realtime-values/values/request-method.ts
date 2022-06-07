import { RealtimeValue } from '@getbeak/types-realtime-value';

const definition: RealtimeValue<any> = {
	type: 'request_method',
	name: 'Request method',
	description: 'Returns the HTTP method of the this request',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => void 0,

	getValue: async ctx => {
		const node = ctx.projectTree[ctx.currentRequestId!];

		if (!node || node.type !== 'request' || node.mode !== 'valid')
			return '';

		return node.info.verb;
	},

	attributes: {
		requiresRequestId: true,
	},
};

export default definition;
