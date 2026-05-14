import { useAppSelector } from '@beak/ui/store/redux';
import type { Context } from '@getbeak/types/values';
import { useMemo } from 'react';

export default function useVariableContext(requestId?: string): Context {
	const variableSets = useAppSelector(s => s.global.variableSets.variableSets);
	const projectTree = useAppSelector(s => s.global.project.tree);
	const flightHistory = useAppSelector(s => s.global.flight.flightHistories);
	const selectedSets = useAppSelector(s => s.global.preferences.editor.selectedVariableSets);

	// Memoize so consumers using context in effect deps don't re-run on every render.
	return useMemo(
		() => ({ variableSets, selectedSets, flightHistory, projectTree, currentRequestId: requestId }),
		[variableSets, selectedSets, flightHistory, projectTree, requestId],
	);
}
