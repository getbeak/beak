import type { Base64DecodedRtv, ValueSections } from '@beak/ui/features/variables/values';
import type { EditableVariable } from '@getbeak/extension-sdk';

import { parseValueSections } from '../parser';

interface EditorState {
	input: ValueSections;
	characterSet: Base64DecodedRtv['characterSet'];
}

const definition: EditableVariable<Base64DecodedRtv, EditorState> = {
	type: 'base64_decoded',
	name: 'Decode (Base64)',
	description: 'Decodes a base64 encoded string',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => ({
		input: [''],
		characterSet: 'base64',
	}),

	resolve: async ({ variableContext: ctx, depth }, payload) => {
		const isArray = Array.isArray(payload.input);
		const input = isArray ? payload.input : [payload.input as unknown as string];

		let encoded = await parseValueSections(ctx, input, depth);

		if (payload.characterSet === 'websafe_base64') encoded = encoded.replaceAll('_', '/').replaceAll('-', '+');

		try {
			const binary = atob(encoded);
			// atob returns a Latin-1 string of the raw bytes. Decode those
			// bytes as UTF-8 so a base64'd UTF-8 source round-trips back
			// to its original Unicode string (emoji, non-Latin scripts).
			const bytes = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
			return { kind: 'text', text: new TextDecoder().decode(bytes) };
		} catch (error) {
			if (error instanceof Error && error.name === 'InvalidCharacterError') return { kind: 'text', text: '' };

			throw error;
		}
	},

	attributes: {},

	editor: {
		createUserInterface: async () => [
			{
				type: 'value_parts_input',
				label: 'Enter the data to decode:',
				stateBinding: 'input',
			},
			{
				type: 'options_input',
				label: 'Pick the digest algorithm:',
				stateBinding: 'characterSet',
				options: [
					{
						key: 'base64',
						label: 'Base64',
					},
					{
						key: 'websafe_base64',
						label: 'Websafe Base64',
					},
				],
			},
		],

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
