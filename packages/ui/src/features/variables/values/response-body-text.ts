import { ResponseBodyTextRtv } from '@beak/ui/features/variables/values';
import binaryStore from '@beak/ui/lib/binary-store';
import { EditableVariable } from '@getbeak/types-variables';

import { getRequestNode } from '../utils/request';
import { getLatestFlight } from '../utils/response';

const definition: EditableVariable<ResponseBodyTextRtv, ResponseBodyTextRtv> = {
	type: 'response_body_text',
	name: 'Response body Text',
	description: 'Returns the body text value of the most recent response for a request',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => ({ requestId: '' }),

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
		createUserInterface: async () => [{
			type: 'request_select_input',
			label: 'Select the request:',
			stateBinding: 'requestId',
		}],

		load: async (_ctx, item) => ({ requestId: item.requestId }),

		save: async (_ctx, _item, state) => ({ requestId: state.requestId }),
	},
};

export default definition;
