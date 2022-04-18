import { Base64EncodedRtv } from '@beak/common/types/realtime-values';

import { RealtimeValue } from '../types';

interface EditorState {
	input: string;
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
			input: '',
			characterSet: 'base64',
			removePadding: false,
		},
	}),


	getValue: async (_ctx, payload) => {
		let encoded = btoa(payload.input);

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
				key: 'base64_websafe',
				label: 'Websafe Base64',
			}],
		}, {
			type: 'checkbox_input',
			label: 'xxx',
			stateBinding: 'removePadding',
		}],

		load: async (_ctx, item) => ({
			characterSet: item.characterSet,
			input: item.input,
			removePadding: item.removePadding,
		}),

		save: async (_ctx, _item, state) => ({
			characterSet: state.characterSet,
			input: state.input,
			removePadding: state.removePadding,
		}),
	},
} as RealtimeValue<Base64EncodedRtv, EditorState>;
