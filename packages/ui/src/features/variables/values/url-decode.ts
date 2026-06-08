import type { ValueSections } from '@beak/ui/features/variables/values';
import type { EditableVariable } from '@getbeak/extension-sdk';

import { parseValueSections } from '../parser';

interface EditorState {
	input: ValueSections;
}

const definition: EditableVariable<EditorState, EditorState> = {
	type: 'url_decode',
	name: 'Decode (URL)',
	description: 'Decodes a url encoded string',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => ({ input: [''] }),

	resolve: async ({ variableContext: ctx, depth }, payload) => {
		const parsed = await parseValueSections(ctx, payload.input, depth);

		try {
			return { kind: 'text', text: decodeURIComponent(parsed) };
		} catch {
			// Malformed escape sequence — surface empty rather than crashing
			// the whole value-section parse.
			return { kind: 'text', text: '' };
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
		],

		load: async (_ctx, item) => ({ input: item.input }),
		save: async (_ctx, _item, state) => ({ input: state.input }),
	},
};

export default definition;
