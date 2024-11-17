import { ValueSections } from '@beak/ui/features/variables/values';

import { NormalizedSelection } from './browser-selection';

type Mode = 'prepend' | 'append' | 'inject';

export interface VariableSelectionState {
	queryStartSelection: NormalizedSelection;
	queryTrailingLength: number;
}

export function determineInsertionMode(
	ValueSections: ValueSections,
	variableSelectionState: VariableSelectionState,
	queryLength: number,
): Mode {
	const { queryStartSelection } = variableSelectionState;
	const { offset, partIndex } = queryStartSelection;

	// Offset is 1 due to the `{` prefix
	if (partIndex === 0 && offset === 1)
		return 'prepend';

	if (partIndex === ValueSections.length - 1) {
		const part = ValueSections[partIndex] as string;

		if (part.length - queryLength === offset + 1)
			return 'append';
	}

	return 'inject';
}
