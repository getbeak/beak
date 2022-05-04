import { RealtimeValuePart } from '@beak/app/features/realtime-values/values';
import type { Context } from '@getbeak/types/values';

import { RealtimeValue } from './types';

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
