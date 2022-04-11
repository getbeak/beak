import { ipcEncryptionService, ipcFsService } from '@beak/app/lib/ipc';
import { PrivateRtv } from '@beak/common/types/realtime-values';
import ksuid from '@cuvva/ksuid';
import path from 'path-browserify';

import { RealtimeValue } from '../types';

interface EditorState {
	value: string;
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

	createValuePart: (_ctx, item) => ({
		type,
		payload: item,
	}),

	getValue: async (_ctx, item) => {
		// Get from private store
		const datumPath = createPath(item.identifier);
		const exists = await ipcFsService.pathExists(datumPath);
		const datum = exists ? await ipcFsService.readText(datumPath) : null;

		if (!datum)
			return '';

		const decrypted = await ipcEncryptionService.decryptString({
			iv: item.iv,
			payload: datum,
		});

		return decrypted;
	},

	editor: {
		ui: [{
			type: 'string_input',
			label: 'Enter the value you want to be private:',
			stateBinding: 'value',
		}],

		load: async (_ctx, item) => {
			// Get from private store
			const datumPath = createPath(item.identifier);
			const exists = await ipcFsService.pathExists(datumPath);
			const datum = exists ? await ipcFsService.readText(datumPath) : null;

			if (!datum)
				return '';

			const decrypted = await ipcEncryptionService.decryptString({
				iv: item.iv,
				payload: datum,
			});

			return { value: decrypted };
		},

		save: async (_ctx, item, state) => {
			// We want to generate a new IV every time
			const iv = await ipcEncryptionService.generateIv();
			const datum = await ipcEncryptionService.encryptString({
				iv,
				payload: state.value,
			});

			// Write to private store
			await ipcFsService.writeText(createPath(item.identifier), datum);

			return { iv, identifier: item.identifier };
		},
	},
} as RealtimeValue<PrivateRtv, EditorState>;

function createPath(identifier: string) {
	return path.join('.beak', 'realtime-values', 'private', `${identifier}`);
}
