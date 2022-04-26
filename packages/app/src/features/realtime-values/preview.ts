import { RealtimeValuePart } from '@beak/common/types/realtime-values';

import { Context, RealtimeValue } from './types';

export async function previewValue<T extends RealtimeValuePart>(
	ctx: Context,
	rtv: RealtimeValue<T>,
	item: any,
	state: T['payload'],
) {
	if (!rtv.editor)
		return '';

	// @ts-expect-error
	const payload = await rtv.editor.save(ctx, item, state);

	return await rtv.getValue(ctx, payload);
}
