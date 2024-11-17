import { TypedObject } from '@beak/common/helpers/typescript';
import { RequestHeaderRtv, ValueSections } from '@beak/ui/features/variables/values';
import { EditableVariable } from '@getbeak/types-variables';

import { parseValueSections } from '../parser';

interface EditorState {
	headerName: ValueSections;
}

const definition: EditableVariable<RequestHeaderRtv, EditorState> = {
	type: 'request_header',
	name: 'Request header',
	description: 'Returns the value of a header from the request',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => ({
		headerName: [''],
	}),

	getValue: async (ctx, payload, recursiveDepth) => {
		const node = ctx.projectTree[ctx.currentRequestId!];

		if (!node || node.type !== 'request' || node.mode !== 'valid')
			return '';

		const parsedHeaderName = await parseValueSections(ctx, payload.headerName, recursiveDepth);
		const headerKey = TypedObject.keys(node.info.headers)
			.find(k => node.info.headers[k].name.toLocaleLowerCase() === parsedHeaderName.toLocaleLowerCase());

		const header = node.info.headers[headerKey!];

		if (!header || !header.value)
			return '';

		return await parseValueSections(ctx, header.value, recursiveDepth);
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
