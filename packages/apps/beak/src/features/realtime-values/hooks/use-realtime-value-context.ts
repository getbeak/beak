import { useAppSelector } from '@beak/app-beak/store/redux';

import { Context } from '../types';

export default function useRealtimeValueContext(requestId?: string): Context {
	const variableGroups = useAppSelector(s => s.global.variableGroups.variableGroups);
	const projectTree = useAppSelector(s => s.global.project.tree);
	const flightHistory = useAppSelector(s => s.global.flight.flightHistory);
	const selectedGroups = useAppSelector(s => s.global.preferences.editor.selectedVariableGroups);

	return { variableGroups, selectedGroups, flightHistory, projectTree, currentRequestId: requestId };
}
