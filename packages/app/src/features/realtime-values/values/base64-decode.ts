import { Base64DecodedRtv, ValueParts } from '@beak/app/features/realtime-values/values';
import { EditableRealtimeValue } from '@getbeak/types-realtime-value';

import { parseValueParts } from '../parser';

const invalidBase64Error = 'Failed to execute \'atob\' on \'Window\': The string to be decoded is not correctly encoded.';

interface EditorState {
	input: ValueParts;
	characterSet: Base64DecodedRtv['characterSet'];
}

const definition: EditableRealtimeValue<Base64DecodedRtv, EditorState> = {
	type: 'base64_decoded',
	name: 'Decode (Base64)',
	description: 'Decodes a base64 encoded string',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => ({
		input: [''],
		characterSet: 'base64',
	}),

	getValue: async (ctx, payload, recursiveDepth) => {
		const isArray = Array.isArray(payload.input);
		const input = isArray ? payload.input : [payload.input as unknown as string];

		let encoded = await parseValueParts(ctx, input, recursiveDepth);

		if (payload.characterSet === 'websafe_base64')
			encoded = encoded.replaceAll('_', '/').replaceAll('-', '+');

		try {
			return atob(encoded);
		} catch (error) {
			if (error instanceof Error && error.name === 'InvalidCharacterError' && error.message.includes(invalidBase64Error))
				return '';

			throw error;
		}
	},

	attributes: {},

	editor: {
		createUserInterface: async () => [{
			type: 'value_parts_input',
			label: 'Enter the data to decode:',
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
		}],

		load: async (_ctx, item) => ({
			characterSet: item.characterSet,
			input: item.input,
		}),

		save: async (_ctx, _item, state) => ({
			characterSet: state.characterSet,
			input: state.input,
		}),
	},
};

export default definition;
