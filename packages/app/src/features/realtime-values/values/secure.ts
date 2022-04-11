import { ipcEncryptionService } from '@beak/app/lib/ipc';
import { SecureRtv } from '@beak/common/types/realtime-values';

import { RealtimeValue } from '../types';

interface EditorState {
	value: string;
}

const type = 'secure';

export default {
	type,

	name: 'Secure',
	description: 'A value protected by Beak project encryption',
	sensitive: true,

	initValuePart: async () => {
		const iv = await ipcEncryptionService.generateIv();

		return {
			type,
			payload: {
				iv,
				datum: '',
			},
		};
	},

	createValuePart: (_ctx, item) => ({
		type,
		payload: item,
	}),

	getValue: async (_ctx, item) => {
		const decrypted = await ipcEncryptionService.decryptString({
			iv: item.iv,
			payload: item.datum,
		});

		return decrypted;
	},

	editor: {
		ui: [{
			type: 'string_input',
			label: 'Enter the value you want to be encrypted:',
			stateBinding: 'value',
		}],

		load: async (ctx, item) => {
			const decrypted = await ipcEncryptionService.decryptString({
				iv: item.iv,
				payload: item.datum,
			});

			return { value: decrypted };
		},

		save: async (_ctx, _item, state) => {
			// We want to generate a new IV every time
			const iv = await ipcEncryptionService.generateIv();
			const datum = await ipcEncryptionService.encryptString({
				iv,
				payload: state.value,
			});

			return { iv, datum };
		},
	},
} as RealtimeValue<SecureRtv, EditorState>;
