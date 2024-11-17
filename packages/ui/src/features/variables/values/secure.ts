import { SecureRtv, ValueSections } from '@beak/ui/features/variables/values';
import { ipcEncryptionService } from '@beak/ui/lib/ipc';
import { EditableVariable } from '@getbeak/types-variables';

import { parseValueSections } from '../parser';

interface EditorState {
	value: ValueSections;
}

const definition: EditableVariable<SecureRtv, EditorState> = {
	type: 'secure',
	name: 'Secure',
	description: 'A value protected by Beak project encryption',
	sensitive: true,
	external: false,

	createDefaultPayload: async () => {
		const iv = await ipcEncryptionService.generateIv();

		return {
			iv,
			cipherText: '',
		};
	},

	getValue: async (ctx, item) => {
		const encryptionSetup = await ipcEncryptionService.checkStatus();

		if (!encryptionSetup) return '[Encryption key missing]';

		// handle legacy
		if (item.datum !== void 0) {
			return await ipcEncryptionService.decryptString({
				iv: item.iv,
				payload: item.datum,
			});
		}

		const decrypted = await ipcEncryptionService.decryptObject<ValueSections>({
			iv: item.iv,
			payload: item.cipherText,
		});

		return await parseValueSections(ctx, decrypted);
	},

	attributes: {},

	editor: {
		createUserInterface: async () => [{
			type: 'value_parts_input',
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

			const decrypted = await ipcEncryptionService.decryptObject<ValueSections>({
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
};

export default definition;
