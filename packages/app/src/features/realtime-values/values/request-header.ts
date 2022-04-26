import { TypedObject } from '@beak/common/helpers/typescript';
import { ValueParts } from '@beak/common/types/beak-project';
import { RequestHeaderRtv } from '@beak/common/types/realtime-values';

import { parseValueParts } from '../parser';
import { RealtimeValue } from '../types';

interface EditorState {
	headerName: ValueParts;
}

const type = 'request_header';

export default {
	type,

	name: 'Request header',
	description: 'Returns the value of a header from the request',
	sensitive: false,

	initValuePart: async () => ({
		type,
		payload: {
			headerName: [''],
		},
	}),

	getRecursiveKey: (ctx, payload) => `${type}:${ctx.currentRequestId}:${JSON.stringify(payload.headerName)}`,
	getValue: async (ctx, payload, recursiveSet) => {
		const node = ctx.projectTree[ctx.currentRequestId!];

		if (!node || node.type !== 'request' || node.mode !== 'valid')
			return '';

		const parsedHeaderName = await parseValueParts(ctx, payload.headerName, recursiveSet);
		const headerKey = TypedObject.keys(node.info.headers)
			.find(k => node.info.headers[k].name.toLocaleLowerCase() === parsedHeaderName.toLocaleLowerCase());

		const header = node.info.headers[headerKey!];

		return header?.value ?? '';
	},

	attributes: {
		requiresRequestId: true,
	},

	editor: {
		ui: [{
			type: 'value_parts_input',
			label: 'Header name:',
			stateBinding: 'headerName',
		}],

		load: async (_ctx, item) => ({ headerName: item.headerName }),
		save: async (_ctx, _item, state) => ({ headerName: state.headerName }),
	},
} as RealtimeValue<RequestHeaderRtv, EditorState>;
