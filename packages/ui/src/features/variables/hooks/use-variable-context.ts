import { useAppSelector } from '@beak/ui/store/redux';
import type { Context } from '@getbeak/types/values';

export default function useVariableContext(requestId?: string): Context {
	const variableSets = useAppSelector(s => s.global.variableSets.variableSets);
	const projectTree = useAppSelector(s => s.global.project.tree);
	const flightHistory = useAppSelector(s => s.global.flight.flightHistory);
	const selectedSets = useAppSelector(s => s.global.preferences.editor.selectedVariableSets);

	return { variableSets, selectedSets, flightHistory, projectTree, currentRequestId: requestId };
}
