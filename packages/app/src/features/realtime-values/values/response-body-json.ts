import binaryStore from '@beak/app/lib/binary-store';
import { attemptTextToJson } from '@beak/app/utils/json';
import { ResponseBodyJsonRtv } from '@beak/common/types/realtime-values';
import jsonPath from 'jsonpath';

import { parseValueParts } from '../parser';
import { RealtimeValue } from '../types';
import { getRequestNode } from '../utils/request';
import { getLatestFlight } from '../utils/response';

const allowedRawJson = ['string', 'bool', 'number'];
const type = 'response_body_json';

export default {
	type,

	name: 'Response body (json)',
	description: 'Returns the body text value of the most recent response for a request',
	sensitive: false,

	initValuePart: async () => ({
		type,
		payload: {
			requestId: '',
			jPath: ['$'],
		},
	}),

	getValue: async (ctx, payload, recursiveSet) => {
		const requestNode = getRequestNode(payload.requestId, ctx);

		if (!requestNode)
			return '';

		const latestFlight = getLatestFlight(requestNode.id, ctx);

		if (!latestFlight?.response)
			return '';

		if (!latestFlight.response.hasBody)
			return '';

		const jPath = await parseValueParts(ctx, payload.jPath, recursiveSet);
		const binary = binaryStore.get(latestFlight.binaryStoreKey);
		const json = new TextDecoder().decode(binary);
		const parsed = attemptTextToJson(json);
		const resolved = attemptJsonPathQuery(parsed, jPath);

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
		createUi: () => [{
			type: 'request_select_input',
			label: 'Select the request:',
			stateBinding: 'requestId',
		}, {
			type: 'value_parts_input',
			label: 'JPath inside body:',
			stateBinding: 'jPath',
		}],

		load: async (_ctx, item) => ({
			requestId: item.requestId,
			jPath: item.jPath,
		}),

		save: async (_ctx, _item, state) => ({
			requestId: state.requestId,
			jPath: state.jPath,
		}),
	},
} as RealtimeValue<ResponseBodyJsonRtv, ResponseBodyJsonRtv['payload']>;

function attemptJsonPathQuery(obj: unknown, query: string) {
	try {
		return jsonPath.query(obj, query, 1)[0];
	} catch (error) {
		// eslint-disable-next-line no-console
		console.warn('Unable to query JSON object with query', error);

		return '';
	}
}
