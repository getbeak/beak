import { DigestRtv, ValueParts } from '@beak/app/features/realtime-values/values';
import { arrayBufferToHexString } from '@beak/app/utils/encoding';
import { EditableRealtimeValue } from '@getbeak/types-realtime-value';
import { Md5 as MD5 } from 'ts-md5';

import { parseValueParts } from '../parser';

interface EditorState {
	input: ValueParts;
	algorithm: DigestRtv['algorithm'];
}

const definition: EditableRealtimeValue<DigestRtv, EditorState> = {
	type: 'digest',
	name: 'Digest / Hash',
	description: 'Generates a digest of a given input. Supports SHA-*, MD5.',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => ({
		algorithm: 'SHA-256',
		input: [''],
		hmac: void 0,
	}),

	getValue: async (ctx, payload, recursiveDepth) => {
		const { algorithm, input, hmac } = payload;
		const isArray = Array.isArray(input);
		const parsed = await parseValueParts(ctx, isArray ? input : [input as unknown as string], recursiveDepth);

		if (algorithm === 'MD5')
			return MD5.hashStr(parsed);

		const buf = new ArrayBuffer(parsed.length * 2);
		const bufView = new Uint16Array(buf);

		for (let i = 0, strLen = parsed.length; i < strLen; i++)
			bufView[i] = parsed.charCodeAt(i);

		if (hmac) {
			// return crypto.subtle.sign(algorithm, key, buf);
			return '';
		}

		const digest = await crypto.subtle.digest(algorithm, buf);

		return arrayBufferToHexString(digest);
	},

	attributes: {},

	editor: {
		createUserInterface: async () => [{
			type: 'value_parts_input',
			label: 'Enter the data for the digest:',
			stateBinding: 'input',
		}, {
			type: 'options_input',
			label: 'Pick the digest algorithm:',
			stateBinding: 'algorithm',
			options: [{
				key: 'SHA-1',
				label: 'SHA-1 (Considered unsafe for cryptographic use)',
			}, {
				key: 'SHA-256',
				label: 'SHA-256',
			}, {
				key: 'SHA-384',
				label: 'SHA-384',
			}, {
				key: 'SHA-512',
				label: 'SHA-512',
			}, {
				key: 'MD5',
				label: 'MD5 (Considered unsafe for cryptographic use)',
			}],
		}],

		load: async (_ctx, item) => ({ algorithm: item.algorithm, input: item.input }),

		save: async (_ctx, _item, state) => ({
			input: state.input,
			algorithm: state.algorithm,
			hmac: void 0,
		}),
	},
};

export default definition;
