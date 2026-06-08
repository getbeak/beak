import binaryStore from '@beak/ui/lib/binary-store';
import type { EditableVariable } from '@getbeak/extension-sdk';

import { getRequestNode } from '../utils/request';
import { getLatestFlight } from '../utils/response';

interface Payload {
	requestId: string;
}

/**
 * RTV that exposes the body of the most-recent flight as a live
 * `ReadableStream<Uint8Array>`. The classic `response_body_text` /
 * `response_body_json` variants block until the response settles and
 * then read the full buffer; this one yields chunks as they arrive,
 * so a chained request (or a Sink-aware consumer like a multipart
 * binary part) can forward the bytes mid-flight.
 *
 * For a text sink the resolver drains the stream — same observable
 * behaviour as the text variant but plumbed through the v2 contract.
 * The streaming win shows up when this variable lands in a
 * `multipart` binary part or (future) a chained request body.
 */
const definition: EditableVariable<Payload, Payload> = {
	type: 'response_body_stream',
	name: 'Response body (stream)',
	description: 'Streaming view over the most-recent response body. Yields chunks as they arrive.',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => ({ requestId: '' }),

	resolve: async (rctx, payload) => {
		const ctx = rctx.variableContext;
		const requestNode = getRequestNode(payload.requestId, ctx);
		if (!requestNode) return { kind: 'text', text: '' };

		const latestFlight = getLatestFlight(requestNode.id, ctx);
		if (!latestFlight?.response) return { kind: 'text', text: '' };
		if (!latestFlight.response.hasBody) return { kind: 'text', text: '' };

		if (!binaryStore.exists(latestFlight.binaryStoreKey)) return { kind: 'text', text: '' };

		const stream = binaryStore.subscribe(latestFlight.binaryStoreKey);
		return { kind: 'stream', stream };
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
		],

		load: async (_ctx, item) => ({ requestId: item.requestId }),
		save: async (_ctx, _item, state) => ({ requestId: state.requestId }),
	},
};

export default definition;
