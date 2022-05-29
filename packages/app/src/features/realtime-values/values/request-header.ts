import { RequestHeaderRtv } from '@beak/app/features/realtime-values/values';
import { ValueParts } from '@beak/app/features/realtime-values/values';
import { TypedObject } from '@beak/common/helpers/typescript';
import { EditableRealtimeValue } from '@getbeak/types-realtime-value';

import { parseValueParts } from '../parser';

interface EditorState {
	headerName: ValueParts;
}

const definition: EditableRealtimeValue<RequestHeaderRtv, EditorState> = {
	type: 'request_header',
	name: 'Request header',
	description: 'Returns the value of a header from the request',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => ({
		headerName: [''],
	}),

	getValue: async (ctx, payload, recursiveSet) => {
		const node = ctx.projectTree[ctx.currentRequestId!];

		if (!node || node.type !== 'request' || node.mode !== 'valid')
			return '';
		
		recursiveSet.add('x');

		const parsedHeaderName = await parseValueParts(ctx, payload.headerName, recursiveSet);
		const headerKey = TypedObject.keys(node.info.headers)
			.find(k => node.info.headers[k].name.toLocaleLowerCase() === parsedHeaderName.toLocaleLowerCase());

		const header = node.info.headers[headerKey!];

		if (!header || !header.value)
			return '';

		return await parseValueParts(ctx, header.value, recursiveSet);
	},

	attributes: {
		requiresRequestId: true,
	},

	editor: {
		createUserInterface: async () => [{
			type: 'value_parts_input',
			label: 'Header name:',
			stateBinding: 'headerName',
		}],

		load: async (_ctx, item) => ({ headerName: item.headerName }),
		save: async (_ctx, _item, state) => ({ headerName: state.headerName }),
	},
};

export default definition;
