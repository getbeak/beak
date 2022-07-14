import { UuidRtv } from '@beak/app/features/realtime-values/values';
import { EditableRealtimeValue } from '@getbeak/types-realtime-value';
import * as uuid from 'uuid';

interface EditorState {
	version: UuidRtv['version'];
}

const definition: EditableRealtimeValue<UuidRtv, EditorState> = {
	type: 'uuid',
	name: 'UUID',
	description: 'Generate a UUID',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => ({
		version: 'v4',
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

	attributes: {},

	editor: {
		createUserInterface: async () => [{
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
};

export default definition;
