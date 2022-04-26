import { RequestMethodRtv } from '@beak/common/types/realtime-values';

import { RealtimeValue } from '../types';

const type = 'request_method';

export default {
	type,

	name: 'Request method',
	description: 'Returns the HTTP method of the this request',
	sensitive: false,

	initValuePart: async () => ({
		type,
		payload: void 0,
	}),

	getValue: async ctx => {
		const node = ctx.projectTree[ctx.currentRequestId!];

		if (!node || node.type !== 'request' || node.mode !== 'valid')
			return '';

		return node.info.verb;
	},

	attributes: {
		requiresRequestId: true,
	},
} as RealtimeValue<RequestMethodRtv>;
