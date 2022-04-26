import { ResponseStatusCodeRtv } from '@beak/common/types/realtime-values';

import { RealtimeValue } from '../types';
import { getRequestNode } from '../utils/request';
import { getLatestFlight } from '../utils/response';

const type = 'response_status_code';

export default {
	type,

	name: 'Response status code',
	description: 'Returns HTTP status code of the most recent response for a request',
	sensitive: false,

	initValuePart: async () => ({
		type,
		payload: {
			requestId: '',
		},
	}),

	getValue: async (ctx, payload) => {
		const requestNode = getRequestNode(payload.requestId, ctx);

		if (!requestNode)
			return '';

		const latestFlight = getLatestFlight(requestNode.id, ctx);

		return latestFlight?.response?.status.toString() ?? '';
	},

	attributes: {
		requiresRequestId: true,
	},

	editor: {
		createUi: () => [{
			type: 'request_select_input',
			label: 'Select the request:',
			stateBinding: 'requestId',
		}],

		load: async (_ctx, item) => ({ requestId: item.requestId }),
		save: async (_ctx, _item, state) => ({ requestId: state.requestId }),
	},
} as RealtimeValue<ResponseStatusCodeRtv, ResponseStatusCodeRtv['payload']>;
