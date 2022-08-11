import type { Context } from '@getbeak/types/values';
import { EditableRealtimeValue } from '@getbeak/types-realtime-value';

export async function previewValue<T>(
	ctx: Context,
	rtv: EditableRealtimeValue<T>,
	item: any,
	state: T,
) {
	const payload = await rtv.editor.save(ctx, item, state);

	return await rtv.getValue(ctx, payload, 0);
}
