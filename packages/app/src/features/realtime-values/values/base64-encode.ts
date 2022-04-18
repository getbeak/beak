import { ValueParts } from '@beak/common/types/beak-project';
import { Base64EncodedRtv } from '@beak/common/types/realtime-values';

import { parseValueParts } from '../parser';
import { RealtimeValue } from '../types';

interface EditorState {
	input: ValueParts;
	characterSet: Base64EncodedRtv['payload']['characterSet'];
	removePadding: boolean;
}

const type = 'base64_encoded';

export default {
	type,

	name: 'Encode (Base64)',
	description: 'Generates a base64 encoded string',
	sensitive: false,

	initValuePart: async () => ({
		type,
		payload: {
			input: [''],
			characterSet: 'base64',
			removePadding: false,
		},
	}),

	getValue: async (ctx, payload) => {
		const isArray = Array.isArray(payload.input);
		const input = isArray ? payload.input : [payload.input as unknown as string];

		const parsed = await parseValueParts(ctx, input);
		let encoded = btoa(parsed);

		if (payload.characterSet === 'websafe_base64')
			encoded = encoded.replaceAll('/', '_').replaceAll('+', '-');

		if (payload.removePadding)
			encoded = encoded.replaceAll('=', '');

		return encoded;
	},

	editor: {
		ui: [{
			type: 'string_input',
			label: 'Enter the data to encode:',
			stateBinding: 'input',
		}, {
			type: 'options_input',
			label: 'Pick the digest algorithm:',
			stateBinding: 'characterSet',
			options: [{
				key: 'base64',
				label: 'Base64',
			}, {
				key: 'websafe_base64',
				label: 'Websafe Base64',
			}],
		}, {
			type: 'checkbox_input',
			label: 'xxx',
			stateBinding: 'removePadding',
		}],

		load: async (_ctx, item) => {
			const isArray = Array.isArray(item.input);

			return {
				characterSet: item.characterSet,
				input: isArray ? item.input : [item.input],
				removePadding: item.removePadding,
			};
		},

		save: async (_ctx, _item, state) => ({
			characterSet: state.characterSet,
			input: state.input,
			removePadding: state.removePadding,
		}),
	},
} as RealtimeValue<Base64EncodedRtv, EditorState>;
