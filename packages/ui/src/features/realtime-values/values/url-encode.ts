import { ValueParts } from '@beak/ui/features/realtime-values/values';
import { EditableRealtimeValue } from '@getbeak/types-realtime-value';

import { parseValueParts } from '../parser';

interface EditorState {
	input: ValueParts;
}

const definition: EditableRealtimeValue<EditorState, EditorState> = {
	type: 'url_encode',
	name: 'Encode (URL)',
	description: 'Generates a url encoded string',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => ({
		input: [''],
	}),

	getValue: async (ctx, payload, recursiveDepth) => {
		const parsed = await parseValueParts(ctx, payload.input, recursiveDepth);

		return encodeURIComponent(parsed);
	},

	attributes: {},

	editor: {
		createUserInterface: async () => [{
			type: 'value_parts_input',
			label: 'Enter the data to encode:',
			stateBinding: 'input',
		}],

		load: async (_ctx, item) => ({ input: item.input }),
		save: async (_ctx, _item, state) => ({ input: state.input }),
	},
};

export default definition;
