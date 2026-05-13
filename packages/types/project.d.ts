export interface ProjectFile {
	id: string;
	name: string;
	version: string;

	/**
	 * True when the project was auto-created as a scratch space on cold start
	 * (no recents). Untitled projects live in a temp folder under userData and
	 * should not be tracked in recents until the user promotes them to a real
	 * location (`project.promoteUntitled`).
	 */
	untitled?: boolean;
}
