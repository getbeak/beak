import type { ApplicationState } from '@beak/ui/store';

const DEFAULT_PRIMARY = 'Environment';

export interface ResolvedCookieJars {
	/**
	 * The variable-set names — in priority order — whose
	 * currently-selected item should contribute cookies to this flight.
	 * The first entry is the primary jar; the rest are the request's
	 * `additionalCookieJarSets`. Earlier entries win on name collisions
	 * (see `selectOutgoingCookies`).
	 */
	enabledJars: string[];
	/** Mirrors `RequestOptions.sendCookies` (default `true`). */
	sendCookies: boolean;
	/** The resolved primary variable set, for UI surfaces that want to label it. */
	primaryVariableSet: string;
}

/**
 * Compute which cookie jars a flight should pull from. Combines the
 * project's primary variable set (defaults to `'Environment'`, falling
 * back to the first variable set alphabetically if absent) with the
 * request's `additionalCookieJarSets`. Dedupes the result so a request
 * that opts in to its own primary doesn't double up.
 *
 * `sendCookies: false` on the request short-circuits the whole thing —
 * the caller still gets the resolved jar list for UI display, but
 * `attachCookiesToFlightRequest` skips the cookie attachment.
 */
export function resolveEnabledCookieJars(state: ApplicationState, requestId: string): ResolvedCookieJars {
	const projectCookies = state.global.project.cookies;
	const variableSets = state.global.variableSets.variableSets ?? {};
	const variableSetNames = Object.keys(variableSets);

	const requestedPrimary = projectCookies?.primaryVariableSet;
	const primaryVariableSet =
		requestedPrimary && variableSets[requestedPrimary]
			? requestedPrimary
			: variableSetNames.includes(DEFAULT_PRIMARY)
				? DEFAULT_PRIMARY
				: (variableSetNames.sort()[0] ?? DEFAULT_PRIMARY);

	const node = state.global.project.tree[requestId];
	const options = node?.type === 'request' && node.mode === 'valid' ? node.info.options : undefined;
	const sendCookies = options?.sendCookies !== false;
	const additional = options?.additionalCookieJarSets ?? [];

	const enabledJars: string[] = [primaryVariableSet];
	const seen = new Set([primaryVariableSet]);
	for (const name of additional) {
		if (seen.has(name)) continue;
		if (!variableSets[name]) continue; // unknown set — ignore
		seen.add(name);
		enabledJars.push(name);
	}

	return { enabledJars, sendCookies, primaryVariableSet };
}
