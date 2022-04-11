import { arrayBufferToHexString } from '@beak/app/utils/encoding';
import { DigestRtv } from '@beak/common/types/beak-project';

import { RealtimeValue } from '../types';

interface EditorState {
	input: string;
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
			input: '',
			hmac: void 0,
		},
	}),

	createValuePart: (_ctx, payload) => ({
		type,
		payload,
	}),

	getValue: async (_ctx, payload) => {
		const buf = new ArrayBuffer(payload.input.length * 2);
		const bufView = new Uint16Array(buf);

		for (let i = 0, strLen = payload.input.length; i < strLen; i++)
			bufView[i] = payload.input.charCodeAt(i);

		if (payload.hmac) {
			// return crypto.subtle.sign(payload.algorithm, key, buf);
			return '';
		}

		const digest = await crypto.subtle.digest(payload.algorithm, buf);

		return arrayBufferToHexString(digest);
	},

	editor: {
		ui: [{
			type: 'string_input',
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
