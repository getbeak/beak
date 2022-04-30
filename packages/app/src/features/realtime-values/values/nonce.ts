import { NonceRtv } from '@beak/app/features/realtime-values/values';
import { toWebSafeBase64 } from '@beak/app/lib/base64';

import { RealtimeValue } from '../types';

const type = 'nonce';

export default {
	type,

	name: 'Nonce',
	description: 'Generates a cryptographically random string',
	sensitive: false,

	initValuePart: async () => ({
		type,
		payload: void 0,
	}),

	getValue: async () => {
		const array = new Uint8Array(10);

		crypto.getRandomValues(array);

		return toWebSafeBase64(array);
	},

	attributes: {},
} as RealtimeValue<NonceRtv>;
