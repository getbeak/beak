import { toWebSafeBase64 } from '@beak/app/utils/base64';
import { NonceRtv } from '@beak/common/types/beak-project';

import { RealtimeValue } from './types';

const type = 'nonce';

export default {
	type,

	name: 'Nonce',
	description: 'Generates a cryptographically random string',

	initValuePart: async () => ({
		type,
		payload: void 0,
	}),

	createValuePart: () => ({
		type,
		payload: void 0,
	}),

	getValue: () => {
		const array = new Uint8Array(10);

		crypto.getRandomValues(array);

		return toWebSafeBase64(array);
	},
} as RealtimeValue<NonceRtv['payload']>;
