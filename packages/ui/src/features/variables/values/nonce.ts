import { toWebSafeBase64 } from '@beak/ui/lib/base64';
import type { Variable } from '@getbeak/types-variables';

const definition: Variable<any> = {
	type: 'nonce',
	name: 'Nonce',
	description: 'Generates a cryptographically random string',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => void 0,

	getValue: async () => {
		const array = new Uint8Array(10);

		crypto.getRandomValues(array);

		return toWebSafeBase64(array);
	},

	attributes: {},
};

export default definition;
