import { getActiveProjectIdHint } from '@beak/ui/services/web-bridge';

import { getRootMode } from '../host';

const projectIdRegex = /\/project\/(.+)/g;

export function getCurrentProjectId(): string | null {
	const { pathname } = window.location;

	const matches = [...pathname.matchAll(projectIdRegex)][0];

	if (matches?.[1]) return matches[1];

	// Memory-mode projects don't navigate the URL; the renderer leaves a
	// hint in sessionStorage so we can still scope per-project work.
	return getActiveProjectIdHint();
}

/**
 * Resolve the fs path of the project currently bound to this window.
 *
 *   - OPFS mode: many projects live as siblings under the `beak` namespace,
 *     so we key off the URL `/project/<projectId>` segment and return
 *     `/<projectId>`.
 *   - FSA mode: the user-picked folder IS the project root — there's exactly
 *     one project per FSA mount — so we return `/` regardless of which
 *     `projectId` the URL carries.
 */
export function getCurrentProjectFolder() {
	if (getRootMode() === 'fsa') return '/';

	const projectId = getCurrentProjectId();

	if (!projectId) return null;

	return `/${projectId}`;
}
