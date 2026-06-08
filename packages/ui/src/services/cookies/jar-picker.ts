import type { ApplicationState } from '@beak/ui/store';

/**
 * Pick the variable-set jar (and currently-selected item) that should
 * receive Set-Cookie entries emitted by a flight. Heuristic:
 *
 * Set-Cookie always deposits into the project's primary cookie jar
 * (configured via `project.json` → `cookies.primaryVariableSet`,
 * defaults to `'Environment'`). Earlier this was a domain-matching
 * heuristic that could pick *any* variable-set jar, which made
 * incoming cookies feel non-deterministic — same host could land in
 * different jars depending on what was already inside them. The
 * primary jar is the deliberate "ambient" jar, so it owns Set-Cookie.
 *
 * Returns null only when the primary jar has no selected item (the
 * user hasn't picked an environment yet); cookies are dropped in that
 * case rather than guessed at.
 *
 * `_cookieDomain` is unused now but kept on the signature so the
 * caller doesn't have to thread changes — and future logic that wants
 * to honour, say, a `cookieDomainOverrides` config knows where to
 * look.
 */
export function pickOwningJar(
	state: ApplicationState,
	_cookieDomain: string,
): { variableSet: string; itemId: string } | null {
	const projectCookies = state.global.project.cookies;
	const selections = state.global.preferences.editor.selectedVariableSets ?? {};
	const variableSets = state.global.variableSets.variableSets ?? {};
	const variableSetNames = Object.keys(variableSets);

	const requestedPrimary = projectCookies?.primaryVariableSet;
	const primary =
		requestedPrimary && variableSets[requestedPrimary]
			? requestedPrimary
			: variableSetNames.includes('Environment')
				? 'Environment'
				: variableSetNames.sort()[0];

	if (!primary) return null;
	const itemId = selections[primary];
	if (!itemId) return null;
	return { variableSet: primary, itemId };
}
