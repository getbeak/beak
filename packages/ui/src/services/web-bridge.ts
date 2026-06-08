// Web-shell bridge: a tiny renderer↔web-host channel that lets the renderer
// publish state the web host's IPC layer needs to scope work per-project.
//
// In disk mode, the project id is in the URL (`/project/<id>`) so IPC handlers
// can derive it directly. In memory mode the URL stays at `/` (no on-disk
// identity yet), so we leave a hint here for the web host to read.
//
// `sessionStorage` access can throw in private-mode browsers, when storage
// has been disabled by the user, or when the quota is exceeded. We swallow
// the failure here — the host's IPC handlers already tolerate a missing
// hint (they treat the project as disk-mode-only or no-project) so the
// renderer keeps booting either way.

const ACTIVE_PROJECT_HINT_KEY = 'beak.web.activeProjectId';

export function getActiveProjectIdHint(): string | null {
	if (typeof window === 'undefined') return null;
	try {
		return window.sessionStorage.getItem(ACTIVE_PROJECT_HINT_KEY);
	} catch {
		return null;
	}
}

export function setActiveProjectIdHint(projectId: string | null): void {
	if (typeof window === 'undefined') return;
	try {
		if (projectId === null) window.sessionStorage.removeItem(ACTIVE_PROJECT_HINT_KEY);
		else window.sessionStorage.setItem(ACTIVE_PROJECT_HINT_KEY, projectId);
	} catch {
		// sessionStorage disabled (private mode / quota); the host will fall
		// back to URL-derived scoping and memory-mode work won't be
		// addressable per-project, which the user is about to find out via
		// the "Save Project As…" prompt anyway.
	}
}
