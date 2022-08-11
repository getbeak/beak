import { ResponseHeaderRtv } from '@beak/app/features/realtime-values/values';
import { TypedObject } from '@beak/common/helpers/typescript';
import { EditableRealtimeValue } from '@getbeak/types-realtime-value';

import { parseValueParts } from '../parser';
import { getRequestNode } from '../utils/request';
import { getLatestFlight } from '../utils/response';

const definition: EditableRealtimeValue<ResponseHeaderRtv, ResponseHeaderRtv> = {
	type: 'response_header',
	name: 'Response header',
	description: 'Returns the header value of the most recent response for a request',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => ({
		requestId: '',
		headerName: [''],
	}),

	getValue: async (ctx, payload, recursiveDepth) => {
		const requestNode = getRequestNode(payload.requestId, ctx);

		if (!requestNode)
			return '';

		const latestFlight = getLatestFlight(requestNode.id, ctx);

		if (!latestFlight?.response)
			return '';

		const headers = latestFlight.response.headers;
		const parsedHeaderName = await parseValueParts(ctx, payload.headerName, recursiveDepth);
		const headerKey = TypedObject.keys(headers)
			.find(k => k.toLocaleLowerCase() === parsedHeaderName.toLocaleLowerCase());

		const header = headers[headerKey!];

		return header ?? '';
	},

	attributes: {
		requiresRequestId: true,
	},

	editor: {
		createUserInterface: async () => [{
			type: 'request_select_input',
			label: 'Select the request:',
			stateBinding: 'requestId',
		}, {
			type: 'value_parts_input',
			label: 'Header name:',
			stateBinding: 'headerName',
		}],

		load: async (_ctx, item) => ({
			requestId: item.requestId,
			headerName: item.headerName,
		}),

		save: async (_ctx, _item, state) => ({
			requestId: state.requestId,
			headerName: state.headerName,
		}),
	},
};

export default definition;
