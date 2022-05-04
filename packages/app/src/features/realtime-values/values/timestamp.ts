import { TimestampRtv } from '@beak/app/features/realtime-values/values';
import { add } from 'date-fns';

import { RealtimeValue } from '../types';

interface EditorState {
	delta: number;
	type: string;
}

const type = 'timestamp';

export default {
	type,

	name: 'Datetime',
	description: 'Render a date-time in a specific format, with an optional delta',
	sensitive: false,

	initValuePart: async () => ({
		type,
		payload: {
			delta: 0,
			type: 'iso_8601',
		},
	}),

	getValue: async (_ctx, item) => {
		const now = new Date();
		const value = item.delta ? add(now, { seconds: item.delta }) : now;

		switch (item.type) {
			case 'iso_8601':
				return value.toISOString();

			case 'unix_s':
				return Math.round(value.getTime() / 1000);

			case 'unix_ms':
				return value.getTime();

			default:
				return 'unknown_type';
		}
	},

	attributes: {},

	editor: {
		createUi: () => [{
			type: 'options_input',
			label: 'Pick a date format:',
			stateBinding: 'type',
			options: [{
				key: 'iso_8601',
				label: 'ISO-8601',
			}, {
				key: 'unix_s',
				label: 'Unix timestamp (seconds)',
			}, {
				key: 'unix_ms',
				label: 'Unix timestamp (ms)',
			}],
		}, {
			type: 'number_input',
			label: 'Delta (in seconds):',
			stateBinding: 'delta',
		}],

		load: async (_ctx, item) => ({ type: item.type, delta: item.delta ?? 0 }),
		save: async (_ctx, _item, state) => ({ type: state.type, delta: state.delta }),
	},
} as RealtimeValue<TimestampRtv, EditorState>;
