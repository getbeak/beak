import { arrayBufferToHexString } from '@beak/app-beak/utils/encoding';
import { ValueParts } from '@beak/shared-common/types/beak-project';
import { DigestRtv } from '@beak/shared-common/types/realtime-values';

import { parseValueParts } from '../parser';
import { RealtimeValue } from '../types';

interface EditorState {
	input: ValueParts;
	algorithm: DigestRtv['payload']['algorithm'];
}

const type = 'digest';

export default {
	type,

	name: 'Digest',
	description: 'Generates a digest of a given input.',
	sensitive: false,

	initValuePart: async () => ({
		type,
		payload: {
			algorithm: 'SHA-256',
			input: [''],
			hmac: void 0,
		},
	}),

	getValue: async (ctx, payload, recursiveSet) => {
		const { algorithm, input, hmac } = payload;
		const isArray = Array.isArray(input);
		const parsed = await parseValueParts(ctx, isArray ? input : [input as unknown as string], recursiveSet);

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
		createUi: () => [{
			type: 'value_parts_input',
			label: 'Enter the data for the digest:',
			stateBinding: 'input',
		}, {
			type: 'options_input',
			label: 'Pick the digest algorithm:',
			stateBinding: 'algorithm',
			options: [{
				key: 'SHA-1',
				label: 'SHA1 (Considered unsafe for cryptographic use)',
			}, {
				key: 'SHA-256',
				label: 'SHA256',
			}, {
				key: 'SHA-384',
				label: 'SHA384',
			}, {
				key: 'SHA-512',
				label: 'SHA512',
			}],
		}],

		load: async (_ctx, item) => ({ algorithm: item.algorithm, input: item.input }),

		save: async (_ctx, _item, state) => ({
			input: state.input,
			algorithm: state.algorithm,
			hmac: void 0,
		}),
	},
} as RealtimeValue<DigestRtv, EditorState>;
