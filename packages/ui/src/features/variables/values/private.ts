import ksuid from '@beak/ksuid';
import type { PrivateRtv, ValueSections } from '@beak/ui/features/variables/values';
import { ipcEncryptionService, ipcFsService } from '@beak/ui/lib/ipc';
import type { EditableVariable } from '@getbeak/extension-sdk';
import path from 'path-browserify';

import { parseValueSections } from '../parser';

interface EditorState {
	value: ValueSections;
}

const definition: EditableVariable<PrivateRtv, EditorState> = {
	type: 'private',
	name: 'Private',
	description:
		'A value only stored locally, and never included in the project (it is also encrypted at rest). Useful for PII fields.',
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

	resolve: async ({ variableContext: ctx, depth }, item) => {
		const encryptionSetup = await ipcEncryptionService.checkStatus();

		if (!encryptionSetup) return { kind: 'text', text: '[Encryption key missing]' };

		// Get from private store
		const cipherTextPath = createPath(item.identifier);
		const exists = await ipcFsService.pathExists(cipherTextPath);
		const cipherText = exists ? await ipcFsService.readText(cipherTextPath) : null;

		if (!cipherText) return { kind: 'text', text: '' };

		const decrypted = await ipcEncryptionService.decryptObject<ValueSections>({
			iv: item.iv,
			payload: cipherText,
		});

		return { kind: 'text', text: await parseValueSections(ctx, decrypted, depth) };
	},

	attributes: {},

	editor: {
		createUserInterface: async () => [
			{
				type: 'value_parts_input',
				label: 'Enter the value you want to be private:',
				stateBinding: 'value',
			},
		],

		load: async (_ctx, item) => {
			// Get from private store
			const cipherTextPath = createPath(item.identifier);
			const exists = await ipcFsService.pathExists(cipherTextPath);
			const cipherText = exists ? await ipcFsService.readText(cipherTextPath) : null;

			if (!cipherText) return { value: [] };

			const decrypted = await ipcEncryptionService.decryptObject<ValueSections>({
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
	return path.join('.beak', 'variables', 'private', `${identifier}`);
}
