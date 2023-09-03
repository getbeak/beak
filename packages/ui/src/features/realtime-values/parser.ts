import { TypedObject } from '@beak/common/helpers/typescript';
import { generateValueIdent } from '@beak/ui/lib/beak-variable-group/utils';
import type { Context, ValueParts } from '@getbeak/types/values';

import { RealtimeValueManager } from '.';

export async function parseValueParts(
	ctx: Context,
	parts: ValueParts,
	depth = 0,
	sensitiveMode = false,
): Promise<string> {
	const out = await Promise.all(parts.map(async p => {
		if (typeof p === 'string')
			return p;

		if (typeof p !== 'object')
			return '';

		const rtv = RealtimeValueManager.getRealtimeValue(p.type);

		if (!rtv)
			return '';

		// Oversimplified check for recursion. I'll build a proper system for this later
		if (depth >= 5)
			return '[Recursion detected]';

		if (sensitiveMode && rtv.sensitive)
			return '[Sensitive mode enabled]';

		try {
			// Easier than using an abort controller
			let complete = false;

			const value = Promise.race([
				rtv.getValue(ctx, p.payload, depth + 1),
				new Promise(resolve => {
					window.setTimeout(() => {
						if (!complete) {
							// eslint-disable-next-line no-console
							console.error(`Fetching value for ${rtv.type} exceeded 600ms`);
						}

						resolve('');
					}, 600);
				}),
			]);

			complete = true;

			return value;
		} catch (error) {
			// TODO(afr): Move this to some sort of alert
			// eslint-disable-next-line no-console
			console.error(`Failed to get value from ${rtv.type}`);

			return '';
		}
	}));

	return out.join('');
}

export function getValueParts(ctx: Context, itemId: string) {
	return getValueObject(ctx, itemId);
}

export function getValueObject(ctx: Context, itemId: string) {
	for (const key of TypedObject.keys(ctx.variableGroups)) {
		const variableGroup = ctx.variableGroups[key];
		const selectedGroup = ctx.selectedGroups[key];
		const value = variableGroup.values[generateValueIdent(selectedGroup, itemId)];

		if (value)
			return value;
	}

	return null;
}
