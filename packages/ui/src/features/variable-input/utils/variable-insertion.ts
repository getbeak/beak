import type { ValuePart, ValueParts } from '@beak/ui/features/realtime-values/values';

import type { NormalizedSelection } from './browser-selection';
import { determineInsertionMode, type VariableSelectionState } from './variables';

export interface InsertVariableResult {
	parts: ValueParts;
	selection: NormalizedSelection;
	closeSelector: boolean;
}

/**
 * Splice a variable token into a list of value parts based on where the user
 * began typing the `{` query trigger.
 *
 * Returns the new parts, where the caret should land after insertion, and
 * whether the variable selector should close (true on success or no-op).
 */
export function insertVariableIntoParts(
	valueParts: ValueParts,
	variableSelectionState: VariableSelectionState,
	variable: ValuePart,
	queryLength: number,
): InsertVariableResult {
	const { queryStartSelection, queryTrailingLength } = variableSelectionState;
	const { offset, partIndex } = queryStartSelection;
	const mode = determineInsertionMode(valueParts, variableSelectionState, queryLength);
	const newPartSelectionIndex = mode === 'append' ? partIndex + 2 : partIndex + 1;
	const mutatedValueParts = [...valueParts];

	if (mode === 'prepend' || mode === 'append') {
		let finalPartIndex = partIndex;

		if (mode === 'prepend') {
			finalPartIndex += 1;
			mutatedValueParts.splice(partIndex, 0, variable);
		} else {
			mutatedValueParts.splice(partIndex + 1, 0, variable);
		}

		const part = mutatedValueParts[finalPartIndex] as string;
		const partWithoutQuery = [part.substring(0, offset - 1), part.substr(part.length - queryTrailingLength)].join('');

		mutatedValueParts[finalPartIndex] = partWithoutQuery;
	} else if (mode === 'inject') {
		const part = mutatedValueParts[partIndex] as string;
		const pre = part.substring(0, offset - 1);
		const post = part.substr(part.length - queryTrailingLength);

		mutatedValueParts[partIndex] = pre;
		mutatedValueParts.splice(partIndex + 1, 0, variable);
		mutatedValueParts.splice(partIndex + 2, 0, post);
	} else {
		return { parts: valueParts, selection: queryStartSelection, closeSelector: true };
	}

	return {
		parts: mutatedValueParts,
		selection: {
			partIndex: newPartSelectionIndex,
			isTextNode: false,
			offset: 0,
		},
		closeSelector: true,
	};
}
