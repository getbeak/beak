import { ipcEncryptionService, ipcFsService } from '@beak/app-beak/lib/ipc';
import { ValueParts } from '@beak/shared-common/types/beak-project';
import { PrivateRtv } from '@beak/shared-common/types/realtime-values';
import ksuid from '@cuvva/ksuid';
import path from 'path-browserify';

import { parseValueParts } from '../parser';
import { RealtimeValue } from '../types';

interface EditorState {
	value: ValueParts;
}

const type = 'private';

export default {
	type,

	name: 'Private',
	description: 'A value only stored locally, and never included in the project (it is also encrypted at rest). Useful for PII fields.',
	sensitive: true,

	initValuePart: async () => {
		const iv = await ipcEncryptionService.generateIv();
		const identifier = ksuid.generate('prvval').toString();

		return {
			type,
			payload: {
				iv,
				identifier,
			},
		};
	},

	getValue: async (ctx, item, recursiveSet) => {
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

		return await parseValueParts(ctx, decrypted, recursiveSet);
	},

	attributes: {},

	editor: {
		createUi: () => [{
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
} as RealtimeValue<PrivateRtv, EditorState>;

function createPath(identifier: string) {
	return path.join('.beak', 'realtime-values', 'private', `${identifier}`);
}
