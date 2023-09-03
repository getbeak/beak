import { PrivateRtv, ValueParts } from '@beak/ui/features/realtime-values/values';
import { ipcEncryptionService, ipcFsService } from '@beak/ui/lib/ipc';
import ksuid from '@beak/ksuid';
import { EditableRealtimeValue } from '@getbeak/types-realtime-value';
import path from 'path-browserify';

import { parseValueParts } from '../parser';

interface EditorState {
	value: ValueParts;
}

const definition: EditableRealtimeValue<PrivateRtv, EditorState> = {
	type: 'private',
	name: 'Private',
	description: 'A value only stored locally, and never included in the project (it is also encrypted at rest). Useful for PII fields.',
	sensitive: true,
	external: false,

	createDefaultPayload: async () => {
		const iv = await ipcEncryptionService.generateIv();
		const identifier = ksuid.generate('prvval').toString();

		return {
			iv,
			identifier,
		};
	},

	getValue: async (ctx, item, recursiveDepth) => {
		const encryptionSetup = await ipcEncryptionService.checkStatus();

		if (!encryptionSetup) return '[Encryption key missing]';

		// Get from private store
		const cipherTextPath = createPath(item.identifier);
		const exists = await ipcFsService.pathExists(cipherTextPath);
		const cipherText = exists ? await ipcFsService.readText(cipherTextPath) : null;

		if (!cipherText)
			return '';

		const decrypted = await ipcEncryptionService.decryptObject<ValueParts>({
			iv: item.iv,
			payload: cipherText,
		});

		return await parseValueParts(ctx, decrypted, recursiveDepth);
	},

	attributes: {},

	editor: {
		createUserInterface: async () => [{
			type: 'value_parts_input',
			label: 'Enter the value you want to be private:',
			stateBinding: 'value',
		}],

		load: async (_ctx, item) => {
			// Get from private store
			const cipherTextPath = createPath(item.identifier);
			const exists = await ipcFsService.pathExists(cipherTextPath);
			const cipherText = exists ? await ipcFsService.readText(cipherTextPath) : null;

			if (!cipherText)
				return { value: [] };

			const decrypted = await ipcEncryptionService.decryptObject<ValueParts>({
				iv: item.iv,
				payload: cipherText,
			});

			return { value: decrypted };
		},

		save: async (_ctx, item, state) => {
			// We want to generate a new IV every time
			const iv = await ipcEncryptionService.generateIv();
			const cipherText = await ipcEncryptionService.encryptObject({
				iv,
				payload: state.value,
			});

			// Write to private store
			await ipcFsService.writeText(createPath(item.identifier), cipherText);

			return { iv, identifier: item.identifier };
		},
	},
};

export default definition;

function createPath(identifier: string) {
	return path.join('.beak', 'realtime-values', 'private', `${identifier}`);
}
