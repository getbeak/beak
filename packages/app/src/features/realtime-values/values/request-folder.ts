import { RequestFolderRtv } from '@beak/common/types/realtime-values';

import { RealtimeValue } from '../types';

const type = 'request_folder';

export default {
	type,

	name: 'Request folder',
	description: 'Returns the name of the folder the request is inside',
	sensitive: false,

	initValuePart: async () => ({
		type,
		payload: void 0,
	}),

	getValue: async ctx => {
		const node = ctx.projectTree[ctx.currentRequestId!];

		if (!node || node.type !== 'request' || node.mode !== 'valid')
			return '';

		const parentNode = ctx.projectTree[node.parent!];

		if (!parentNode || parentNode.type !== 'folder')
			return '';

		return parentNode.name;
	},

	attributes: {
		requiresRequestId: true,
	},
} as RealtimeValue<RequestFolderRtv>;
