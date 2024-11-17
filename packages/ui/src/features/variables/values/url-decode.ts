import { ValueSections } from '@beak/ui/features/variables/values';
import { EditableVariable } from '@getbeak/types-variables';

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

	getValue: async (ctx, payload, recursiveDepth) => {
		const parsed = await parseValueSections(ctx, payload.input, recursiveDepth);

		return decodeURIComponent(parsed);
	},

	attributes: {},

	editor: {
		createUserInterface: async () => [{
			type: 'value_parts_input',
			label: 'Enter the data to decode:',
			stateBinding: 'input',
		}],

		load: async (_ctx, item) => ({ input: item.input }),
		save: async (_ctx, _item, state) => ({ input: state.input }),
	},
};

export default definition;
