import { TimestampRtv } from '@beak/common/types/beak-project';

import { RealtimeValue } from './types';

const formatTypes = [
	'iso_8601',
	'unix_s',
	'unix_ms',
];

interface EditorState {
	type: string;
}

const type = 'timestamp';

export default {
	type,

	name: 'Timestamp',
	description: 'Render a timestamp in a certain format',

	initValuePart: async () => ({
		type,
		payload: {
			type: 'iso_8601',
		},
	}),

	createValuePart: item => ({
		type,
		payload: item,
	}),

	getValue: async item => {
		const now = new Date();

		switch (item.type) {
			case 'iso_8601':
				return now.toISOString();

			case 'unix_s':
				return Math.round(now.getTime() / 1000);

			case 'unix_ms':
				return now.getTime();

			default:
				return 'unknown_type';
		}
	},

	editor: {
		ui: [{
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
		}],

		load: async item => ({ type: item.type }),
		save: async (_item, state) => ({ type: state.type }),
	},
} as RealtimeValue<TimestampRtv['payload'], EditorState>;
