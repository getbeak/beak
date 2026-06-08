import { TypedObject } from '@beak/common/helpers/typescript';
import type { ResponseHeaderRtv } from '@beak/ui/features/variables/values';
import type { EditableVariable } from '@getbeak/extension-sdk';

import { parseValueSections } from '../parser';
import { getRequestNode } from '../utils/request';
import { getLatestFlight } from '../utils/response';

const definition: EditableVariable<ResponseHeaderRtv, ResponseHeaderRtv> = {
	type: 'response_header',
	name: 'Response header',
	description: 'Returns the header value of the most recent response for a request',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => ({
		requestId: '',
		headerName: [''],
	}),

	resolve: async ({ variableContext: ctx, depth }, payload) => {
		const requestNode = getRequestNode(payload.requestId, ctx);

		if (!requestNode) return { kind: 'text', text: '' };

		const latestFlight = getLatestFlight(requestNode.id, ctx);

		if (!latestFlight?.response) return { kind: 'text', text: '' };

		const headers = latestFlight.response.headers;
		const parsedHeaderName = await parseValueSections(ctx, payload.headerName, depth);
		const headerKey = TypedObject.keys(headers).find(k => k.toLocaleLowerCase() === parsedHeaderName.toLocaleLowerCase());

		const header = headers[headerKey!];

		return { kind: 'text', text: header ?? '' };
	},

	attributes: {
		requiresRequestId: true,
	},

	editor: {
		createUserInterface: async () => [
			{
				type: 'request_select_input',
				label: 'Select the request:',
				stateBinding: 'requestId',
			},
			{
				type: 'value_parts_input',
				label: 'Header name:',
				stateBinding: 'headerName',
			},
		],

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
