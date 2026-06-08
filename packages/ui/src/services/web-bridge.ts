// Web-shell bridge: a tiny renderer↔web-host channel that lets the renderer
// publish state the web host's IPC layer needs to scope work per-project.
//
// In disk mode, the project id is in the URL (`/project/<id>`) so IPC handlers
// can derive it directly. In memory mode the URL stays at `/` (no on-disk
// identity yet), so we leave a hint here for the web host to read.

const ACTIVE_PROJECT_HINT_KEY = 'beak.web.activeProjectId';

export function getActiveProjectIdHint(): string | null {
	if (typeof window === 'undefined') return null;
	return window.sessionStorage.getItem(ACTIVE_PROJECT_HINT_KEY);
}

export function setActiveProjectIdHint(projectId: string | null): void {
	if (typeof window === 'undefined') return;
	if (projectId === null) window.sessionStorage.removeItem(ACTIVE_PROJECT_HINT_KEY);
	else window.sessionStorage.setItem(ACTIVE_PROJECT_HINT_KEY, projectId);
}
