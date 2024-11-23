import { ResponseStatusCodeRtv } from '@beak/ui/features/variables/values';
import { EditableVariable } from '@getbeak/types-variables';

import { getRequestNode } from '../utils/request';
import { getLatestFlight } from '../utils/response';

const definition: EditableVariable<ResponseStatusCodeRtv, ResponseStatusCodeRtv> = {
	type: 'response_status_code',
	name: 'Response status code',
	description: 'Returns HTTP status code of the most recent response for a request',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => ({ requestId: '' }),

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
