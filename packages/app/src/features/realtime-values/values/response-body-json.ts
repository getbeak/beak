import { ResponseBodyJsonRtv } from '@beak/app/features/realtime-values/values';
import binaryStore from '@beak/app/lib/binary-store';
import { attemptTextToJson } from '@beak/app/utils/json';
import { EditableRealtimeValue } from '@getbeak/types-realtime-value';
import get from 'lodash.get';

import { parseValueParts } from '../parser';
import { getRequestNode } from '../utils/request';
import { getLatestFlight } from '../utils/response';

const allowedRawJson = ['string', 'bool', 'number'];

const definition: EditableRealtimeValue<ResponseBodyJsonRtv, ResponseBodyJsonRtv> = {
	type: 'response_body_json',
	name: 'Response body (json)',
	description: 'Returns the body text value of the most recent response for a request',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => ({
		requestId: '',
		dotPath: [''],
	}),

	getValue: async (ctx, payload, recursiveDepth) => {
		const requestNode = getRequestNode(payload.requestId, ctx);

		if (!requestNode)
			return '';

		const latestFlight = getLatestFlight(requestNode.id, ctx);

		if (!latestFlight?.response)
			return '';

		if (!latestFlight.response.hasBody)
			return '';

		const dotPath = await parseValueParts(ctx, payload.dotPath, recursiveDepth);
		const binary = binaryStore.get(latestFlight.binaryStoreKey);
		const json = new TextDecoder().decode(binary);
		const parsed = attemptTextToJson(json);
		const resolved = dotPath === '' ? parsed : get(parsed, dotPath, '');

		if (!resolved)
			return '';

		if (allowedRawJson.includes(typeof resolved))
			return resolved;

		return JSON.stringify(resolved);
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
			label: 'JSON dot path:',
			stateBinding: 'dotPath',
		}],

		load: async (_ctx, item) => ({
			requestId: item.requestId,
			dotPath: item.dotPath,
		}),

		save: async (_ctx, _item, state) => ({
			requestId: state.requestId,
			dotPath: state.dotPath,
		}),
	},
};

export default definition;
