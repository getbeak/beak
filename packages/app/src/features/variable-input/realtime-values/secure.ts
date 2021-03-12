import { ipcEncryptionService } from '@beak/app/lib/ipc';
import { SecureRtv } from '@beak/common/types/beak-project';

import { RealtimeValue } from './types';

interface EditorState {
	value: string;
}

const type = 'secure';

export default {
	type,

	name: 'Secure',
	description: 'A value protected by Beak project encryption.',

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

	getValue: async (ctx, item) => {
		const decrypted = await ipcEncryptionService.decryptString({
			iv: item.iv,
			payload: item.datum,
			projectFolder: ctx.projectPath,
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
				projectFolder: ctx.projectPath,
			});

			return { value: decrypted };
		},

		save: async (ctx, item, state) => {
			const { iv } = item;
			const datum = await ipcEncryptionService.encryptString({
				iv,
				payload: state.value,
				projectFolder: ctx.projectPath,
			});

			return { iv, datum };
		},
	},
} as RealtimeValue<SecureRtv['payload'], EditorState>;
