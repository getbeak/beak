import type { Context } from '@getbeak/types/values';
import { EditableVariable } from '@getbeak/types-variables';

export async function previewValue<T extends Record<string, any>>(
	ctx: Context,
	rtv: EditableVariable<T>,
	item: any,
	state: T,
) {
	if (!rtv.editor)
		return 'Editor not available';

	if (!rtv.editor.save)
		return await rtv.getValue(ctx, state, 0);

	const payload = await rtv.editor.save(ctx, item, state);

	return await rtv.getValue(ctx, payload, 0);
}
