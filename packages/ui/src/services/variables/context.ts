import type { ApplicationState } from '@beak/ui/store';
import type { Context } from '@getbeak/types/values';

/**
 * Build a variable-resolution {@link Context} from the canonical Redux
 * shape. Single source of truth for the four slice paths that feed it
 * (`variableSets.variableSets`, `flight.flightHistories`, `project.tree`,
 * `preferences.editor.selectedVariableSets`); the React hook
 * `useVariableContext` is now a thin memoising wrapper around this and
 * saga / test code calls this function directly.
 *
 * Pure — does not read or write Redux. Callers that need to react to
 * store changes (component renders) should keep using the hook so they
 * get the memoisation; effects that fire on a single action read the
 * latest state from `api.getState()` and call this once.
 */
export function makeVariableContext(state: ApplicationState, requestId?: string): Context {
	return {
		variableSets: state.global.variableSets.variableSets,
		selectedSets: state.global.preferences.editor.selectedVariableSets,
		flightHistory: state.global.flight.flightHistories,
		projectTree: state.global.project.tree,
		currentRequestId: requestId,
	};
}
