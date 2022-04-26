import { RequestNameRtv } from '@beak/common/types/realtime-values';

import { RealtimeValue } from '../types';

const type = 'request_name';

export default {
	type,

	name: 'Request name',
	description: 'Returns the name of the this request',
	sensitive: false,

	initValuePart: async () => ({
		type,
		payload: void 0,
	}),

	getValue: async ctx => {
		const node = ctx.projectTree[ctx.currentRequestId!];

		if (!node || node.type !== 'request')
			return '';

		return node.name;
	},

	attributes: {
		requiresRequestId: true,
	},
} as RealtimeValue<RequestNameRtv>;
