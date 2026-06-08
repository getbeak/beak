import type { TimestampRtv } from '@beak/ui/features/variables/values';
import type { EditableVariable } from '@getbeak/extension-sdk';
import { add } from 'date-fns';

interface EditorState {
	delta: number;
	type: string;
}

const definition: EditableVariable<TimestampRtv, EditorState> = {
	type: 'timestamp',
	name: 'Datetime',
	getContextAwareName: payload => `Datetime (${payload.type})`,

	description: 'Render a date-time in a specific format, with an optional delta',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => ({
		delta: 0,
		type: 'iso_8601',
	}),

	resolve: async (_ctx, item) => {
		const now = new Date();
		const value = item.delta ? add(now, { seconds: item.delta }) : now;

		let text: string;
		switch (item.type) {
			case 'iso_8601':
				text = value.toISOString();
				break;
			case 'unix_s':
				text = Math.round(value.getTime() / 1000).toString(10);
				break;
			case 'unix_ms':
				text = value.getTime().toString();
				break;
			default:
				text = 'unknown_type';
		}
		return { kind: 'text', text };
	},

	attributes: {},

	editor: {
		createUserInterface: async () => [
			{
				type: 'options_input',
				label: 'Pick a date format:',
				stateBinding: 'type',
				options: [
					{
						key: 'iso_8601',
						label: 'ISO-8601',
					},
					{
						key: 'unix_s',
						label: 'Unix timestamp (seconds)',
					},
					{
						key: 'unix_ms',
						label: 'Unix timestamp (ms)',
					},
				],
			},
			{
				type: 'number_input',
				label: 'Delta (in seconds):',
				stateBinding: 'delta',
			},
		],

		load: async (_ctx, item) => ({ type: item.type, delta: item.delta ?? 0 }),
		save: async (_ctx, _item, state) => ({ type: state.type, delta: state.delta }),
	},
};

export default definition;
