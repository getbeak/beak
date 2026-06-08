import { toWebSafeBase64 } from '@beak/ui/lib/base64';
import type { Variable } from '@getbeak/extension-sdk';

const definition: Variable<any> = {
	type: 'nonce',
	name: 'Nonce',
	description: 'Generates a cryptographically random string',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => void 0,

	resolve: async () => {
		const array = new Uint8Array(10);

		crypto.getRandomValues(array);

		return { kind: 'text', text: toWebSafeBase64(array) };
	},

	attributes: {},
};

export default definition;
