import { ipcExtensionsService } from '@beak/app/lib/ipc';
import { EditableRealtimeValue } from '@getbeak/types-realtime-value';
import type { Context } from '@getbeak/types/values';

export async function previewValue<T>(
	ctx: Context,
	rtv: EditableRealtimeValue<T>,
	item: any,
	state: T,
) {
	const payload = await rtv.editor.save(ctx, item, state);

	if (rtv.external) {
		return await ipcExtensionsService.rtvGetValue({
			type: rtv.type,
			context: ctx,
			payload: payload,
			recursiveSet: [],
		});
	}

	return await rtv.getValue(ctx, payload, new Set());
}
