import type { ResponseBodyJsonRtv } from '@beak/ui/features/variables/values';
import binaryStore from '@beak/ui/lib/binary-store';
import { attemptTextToJson } from '@beak/ui/utils/json';
import type { EditableVariable } from '@getbeak/extension-sdk';
import get from 'lodash.get';

import { parseValueSections } from '../parser';
import { getRequestNode } from '../utils/request';
import { getLatestFlight } from '../utils/response';

const allowedRawJson = ['string', 'boolean', 'number'];

const definition: EditableVariable<ResponseBodyJsonRtv, ResponseBodyJsonRtv> = {
	type: 'response_body_json',
	name: 'Response body (JSON)',
	getContextAwareName: payload => `Response body JSON (${payload.dotPath.join('.')})`,

	description: 'Returns the body text value of the most recent response for a request',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => ({
		requestId: '',
		dotPath: [''],
	}),

	resolve: async ({ variableContext: ctx, depth }, payload) => {
		const requestNode = getRequestNode(payload.requestId, ctx);

		if (!requestNode) return { kind: 'text', text: '' };

		const latestFlight = getLatestFlight(requestNode.id, ctx);

		if (!latestFlight?.response) return { kind: 'text', text: '' };

		if (!latestFlight.response.hasBody) return { kind: 'text', text: '' };

		const dotPath = await parseValueSections(ctx, payload.dotPath, depth);
		const binary = binaryStore.get(latestFlight.binaryStoreKey);
		const json = new TextDecoder().decode(binary);
		const parsed = attemptTextToJson(json);
		const resolved = dotPath === '' ? parsed : get(parsed, dotPath, '');

		if (!resolved) return { kind: 'text', text: '' };

		if (allowedRawJson.includes(typeof resolved)) return { kind: 'text', text: String(resolved) };

		return { kind: 'text', text: JSON.stringify(resolved) };
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
				label: 'JSON dot path:',
				stateBinding: 'dotPath',
			},
		],

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
