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

	createValuePart: item => ({
		type,
		payload: item,
	}),

	// TODO(afr): Read the project path in correctly, somehow

	getValue: async item => {
		const decrypted = await ipcEncryptionService.decryptString({
			iv: item.iv,
			payload: item.datum,
			projectFolder: '/Users/afr/Documents/Beaks/Acme Api',
		});

		return decrypted;
	},

	editor: {
		ui: [{
			type: 'string_input',
			label: 'Enter the value you want to be encrypted:',
			stateBinding: 'value',
		}],

		load: async item => {
			const decrypted = await ipcEncryptionService.decryptString({
				iv: item.iv,
				payload: item.datum,
				projectFolder: '/Users/afr/Documents/Beaks/Acme Api',
			});

			return { value: decrypted };
		},

		save: async (item, state) => {
			const { iv } = item;
			const datum = await ipcEncryptionService.encryptString({
				iv,
				payload: state.value,
				projectFolder: '/Users/afr/Documents/Beaks/Acme Api',
			});

			return { iv, datum };
		},
	},
} as RealtimeValue<SecureRtv['payload'], EditorState>;
