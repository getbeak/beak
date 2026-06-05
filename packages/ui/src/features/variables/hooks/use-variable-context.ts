import { makeVariableContext } from '@beak/ui/services/variables/context';
import { useAppSelector } from '@beak/ui/store/redux';
import type { Context } from '@getbeak/types/values';
import { useMemo } from 'react';

/**
 * React-side variable-context hook. Subscribes to the four slices that
 * feed `Context` and memoises the result so effect deps stay stable.
 * Delegates the shape itself to `makeVariableContext` — the saga / test
 * callers use the maker directly so all three paths share one source
 * of truth for what a context contains.
 */
export default function useVariableContext(requestId?: string): Context {
	const variableSets = useAppSelector(s => s.global.variableSets.variableSets);
	const projectTree = useAppSelector(s => s.global.project.tree);
	const flightHistory = useAppSelector(s => s.global.flight.flightHistories);
	const selectedSets = useAppSelector(s => s.global.preferences.editor.selectedVariableSets);

	return useMemo(
		() => ({ variableSets, selectedSets, flightHistory, projectTree, currentRequestId: requestId }),
		[variableSets, selectedSets, flightHistory, projectTree, requestId],
	);
}

export { makeVariableContext };
