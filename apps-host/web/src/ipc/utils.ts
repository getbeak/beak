import { getRootMode } from '../host';

const projectIdRegex = /\/project\/(.+)/g;

export function getCurrentProjectId() {
	const { pathname } = window.location;

	const matches = [...pathname.matchAll(projectIdRegex)][0];

	const projectId = matches[1];

	if (!projectId) return null;

	return projectId;
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
