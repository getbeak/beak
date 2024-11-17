import { TypedObject } from '@beak/common/helpers/typescript';
import { generateValueIdent } from '@beak/ui/lib/beak-variable-set/utils';
import type { Context, ValueSections } from '@getbeak/types/values';

import { VariableManager } from '.';

export async function parseValueSections(
	ctx: Context,
	parts: ValueSections,
	depth = 0,
	sensitiveMode = false,
): Promise<string> {
	const out = await Promise.all(parts.map(async p => {
		if (typeof p === 'string')
			return p;

		if (typeof p !== 'object')
			return '';

		const rtv = VariableManager.getVariable(p.type);

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
						if (!complete)

							console.error(`Fetching value for ${rtv.type} exceeded 600ms`);

						resolve('');
					}, 600);
				}),
			]);

			complete = true;

			return value;
		} catch {
			// TODO(afr): Move this to some sort of alert

			console.error(`Failed to get value from ${rtv.type}`);

			return '';
		}
	}));

	return out.join('');
}

export function getValueSections(ctx: Context, itemId: string) {
	return getValueObject(ctx, itemId);
}

export function getValueObject(ctx: Context, itemId: string) {
	for (const key of TypedObject.keys(ctx.variableSets)) {
		const variableSet = ctx.variableSets[key];
		const selectedSet = ctx.selectedSets[key];
		const value = variableSet.values[generateValueIdent(selectedSet, itemId)];

		if (value)
			return value;
	}

	return null;
}
