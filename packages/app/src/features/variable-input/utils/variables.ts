import { ValueParts } from '@beak/app/features/realtime-values/values';

import { NormalizedSelection } from './browser-selection';

type Mode = 'prepend' | 'append' | 'inject';

export interface VariableSelectionState {
	queryStartSelection: NormalizedSelection;
	queryTrailingLength: number;
}

export function determineInsertionMode(
	valueParts: ValueParts,
	variableSelectionState: VariableSelectionState,
	queryLength: number,
): Mode {
	const { queryStartSelection } = variableSelectionState;
	const { offset, partIndex } = queryStartSelection;

	// Offset is 1 due to the `{` prefix
	if (partIndex === 0 && offset === 1)
		return 'prepend';

	if (partIndex === valueParts.length - 1) {
		const part = valueParts[partIndex] as string;

		if (part.length - queryLength === offset + 1)
			return 'append';
	}

	return 'inject';
}
