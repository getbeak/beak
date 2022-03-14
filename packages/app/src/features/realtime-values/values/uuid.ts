import { UuidRtv } from '@beak/common/types/beak-project';
import uuid from 'uuid';

import { RealtimeValue } from '../types';

interface EditorState {
	version: string;
}

const type = 'uuid';

export default {
	type,

	name: 'UUID',
	description: 'Generate a UUID',
	sensitive: false,

	initValuePart: async () => ({
		type,
		payload: {
			version: 'v4',
		},
	}),

	createValuePart: (_ctx, item) => ({
		type,
		payload: item,
	}),

	getValue: async (_ctx, item) => {
		switch (item.version) {
			case 'v1':
				return uuid.v1();

			case 'v4':
				return uuid.v4();

			default:
				return 'unknown_version';
		}
	},

	editor: {
		ui: [{
			type: 'options_input',
			label: 'Pick a UUID format:',
			stateBinding: 'version',
			options: [{
				key: 'v1',
				label: 'UUID v1',
			}, {
				key: 'v4',
				label: 'UUID v4',
			}],
		}],

		load: async (_ctx, item) => ({ version: item.version }),
		save: async (_ctx, _item, state) => ({ version: state.version }),
	},
} as RealtimeValue<UuidRtv['payload'], EditorState>;