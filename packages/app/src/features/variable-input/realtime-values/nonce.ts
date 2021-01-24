import { toWebSafeBase64 } from '@beak/app/utils/base64';
import { NonceValue } from '@beak/common/types/beak-project';
import * as uuid from 'uuid';

import { RealtimeValueImplementation } from './types';

const type = 'nonce';

export default {
	type,

	toHtml: () => ({
		type,
		key: `${type}:${uuid.v4()}`,
		dataset: { },
		renderer: {
			title: 'Nonce',
		},
	}),

	fromHtml: () => ({ type }),

	parse: () => {
		const array = new Uint8Array(10);

		crypto.getRandomValues(array);

		return toWebSafeBase64(array);
	},
} as RealtimeValueImplementation<NonceValue>;
