const projectIdRegex = /\/project\/(.+)/g;

export function getCurrentProjectId() {
	const { pathname } = window.location;

	const matches = [...pathname.matchAll(projectIdRegex)][0];

	const projectId = matches[1];

	if (!projectId) return null;

	return projectId;
}

export function getCurrentProjectFolder() {
	const projectId = getCurrentProjectId();

	if (!projectId) return null;

	return `/${projectId}`;
}
