import binaryStore from '@beak/app-beak/lib/binary-store';
import { ResponseBodyTextRtv } from '@beak/shared-common/types/realtime-values';

import { RealtimeValue } from '../types';
import { getRequestNode } from '../utils/request';
import { getLatestFlight } from '../utils/response';

const type = 'response_body_text';

export default {
	type,

	name: 'Response body (text)',
	description: 'Returns the body text value of the most recent response for a request',
	sensitive: false,

	initValuePart: async () => ({
		type,
		payload: { requestId: '' },
	}),

	getValue: async (ctx, payload) => {
		const requestNode = getRequestNode(payload.requestId, ctx);

		if (!requestNode)
			return '';

		const latestFlight = getLatestFlight(requestNode.id, ctx);

		if (!latestFlight?.response)
			return '';

		if (!latestFlight.response.hasBody)
			return '';

		const binary = binaryStore.get(latestFlight.binaryStoreKey);
		const body = new TextDecoder().decode(binary);

		return body;
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
} as RealtimeValue<ResponseBodyTextRtv, ResponseBodyTextRtv['payload']>;
