import type { Base64EncodedRtv, ValueSections } from '@beak/ui/features/variables/values';
import type { EditableVariable } from '@getbeak/extension-sdk';

import { parseValueSections } from '../parser';

interface EditorState {
	input: ValueSections;
	characterSet: Base64EncodedRtv['characterSet'];
	removePadding: boolean;
}

const definition: EditableVariable<Base64EncodedRtv, EditorState> = {
	type: 'base64_encoded',
	name: 'Encode (Base64)',
	description: 'Generates a base64 encoded string',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => ({
		input: [''],
		characterSet: 'base64',
		removePadding: false,
	}),

	getValue: async (ctx, payload, recursiveDepth) => {
		const isArray = Array.isArray(payload.input);
		const input = isArray ? payload.input : [payload.input as unknown as string];

		const parsed = await parseValueSections(ctx, input, recursiveDepth);
		// Encode UTF-8 → base64. btoa alone throws on any non-Latin-1
		// codepoint (emoji, Cyrillic, CJK, etc.), so first convert to
		// a binary string of UTF-8 bytes.
		const bytes = new TextEncoder().encode(parsed);
		let binary = '';
		for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
		let encoded = btoa(binary);

		if (payload.characterSet === 'websafe_base64')
			encoded = encoded.replaceAll('/', '_').replaceAll('+', '-');

		if (payload.removePadding)
			encoded = encoded.replaceAll('=', '');

		return encoded;
	},

	attributes: {},

	editor: {
		createUserInterface: async () => [{
			type: 'value_parts_input',
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
			label: 'Remove padding:',
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
};

export default definition;
