import { ipcEncryptionService } from '@beak/app/lib/ipc';
import { ValueParts } from '@beak/common/types/beak-project';
import { SecureRtv } from '@beak/common/types/realtime-values';

import { parseValueParts } from '../parser';
import { RealtimeValue } from '../types';

interface EditorState {
	value: ValueParts;
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
				cipherText: '',
			},
		};
	},

	getValue: async (ctx, item) => {
		// handle legacy
		if (item.datum !== void 0) {
			return await ipcEncryptionService.decryptString({
				iv: item.iv,
				payload: item.datum,
			});
		}

		const decrypted = await ipcEncryptionService.decryptObject<ValueParts>({
			iv: item.iv,
			payload: item.cipherText,
		});

		return await parseValueParts(ctx, decrypted);
	},

	attributes: {},

	editor: {
		ui: [{
			type: 'string_input',
			label: 'Enter the value you want to be encrypted:',
			stateBinding: 'value',
		}],

		load: async (_ctx, item) => {
			if (item.datum !== void 0) {
				const decrypted = await ipcEncryptionService.decryptString({
					iv: item.iv,
					payload: item.datum,
				});

				return { value: [decrypted] };
			}

			const decrypted = await ipcEncryptionService.decryptObject<ValueParts>({
				iv: item.iv,
				payload: item.cipherText,
			});

			return { value: decrypted };
		},

		save: async (_ctx, _item, state) => {
			// We want to generate a new IV every time
			const iv = await ipcEncryptionService.generateIv();
			const cipherText = await ipcEncryptionService.encryptObject({
				iv,
				payload: state.value,
			});

			return { iv, cipherText };
		},
	},
} as RealtimeValue<SecureRtv, EditorState>;
