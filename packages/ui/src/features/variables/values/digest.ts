import type { DigestRtv, ValueSections } from '@beak/ui/features/variables/values';
import { arrayBufferToHexString } from '@beak/ui/utils/encoding';
import type { EditableVariable } from '@getbeak/extension-sdk';
import { Md5 as MD5 } from 'ts-md5';

import { parseValueSections } from '../parser';

interface EditorState {
	input: ValueSections;
	algorithm: DigestRtv['algorithm'];
}

const definition: EditableVariable<DigestRtv, EditorState> = {
	type: 'digest',
	name: 'Hash',
	description: 'Generates a digest of a given input, with a specified hash function Supports SHA-*, MD5.',
	keywords: ['sha', 'md5', 'sha1', 'sha2', 'sha256', 'sha-384', 'sha512'],
	sensitive: false,
	external: false,

	getContextAwareName: payload => `Hash (${payload.algorithm})`,

	createDefaultPayload: async () => ({
		algorithm: 'SHA-256',
		input: [''],
		hmac: void 0,
	}),

	resolve: async ({ variableContext: ctx, depth }, payload) => {
		const { algorithm, input, hmac } = payload;
		const isArray = Array.isArray(input);
		const parsed = await parseValueSections(ctx, isArray ? input : [input as unknown as string], depth);

		if (algorithm === 'MD5') return { kind: 'text', text: MD5.hashStr(parsed) };

		// Hash the UTF-8 bytes — matches openssl/curl/etc. so digests are
		// interoperable with other tooling. Encoding via Uint16Array (the
		// previous approach) hashed the JS UTF-16 representation, which
		// produced different output for any non-ASCII input.
		const bytes = new TextEncoder().encode(parsed);

		if (hmac) {
			// return crypto.subtle.sign(algorithm, key, bytes);
			return { kind: 'text', text: '' };
		}

		const digest = await crypto.subtle.digest(algorithm, bytes);

		return { kind: 'text', text: arrayBufferToHexString(digest) };
	},

	attributes: {},

	editor: {
		createUserInterface: async () => [
			{
				type: 'value_parts_input',
				label: 'Enter the data for the digest:',
				stateBinding: 'input',
			},
			{
				type: 'options_input',
				label: 'Pick the digest algorithm:',
				stateBinding: 'algorithm',
				options: [
					{
						key: 'SHA-1',
						label: 'SHA-1 (Considered unsafe for cryptographic use)',
					},
					{
						key: 'SHA-256',
						label: 'SHA-256',
					},
					{
						key: 'SHA-384',
						label: 'SHA-384',
					},
					{
						key: 'SHA-512',
						label: 'SHA-512',
					},
					{
						key: 'MD5',
						label: 'MD5 (Considered unsafe for cryptographic use)',
					},
				],
			},
		],

		load: async (_ctx, item) => ({ algorithm: item.algorithm, input: item.input }),

		save: async (_ctx, _item, state) => ({
			input: state.input,
			algorithm: state.algorithm,
			hmac: void 0,
		}),
	},
};

export default definition;
