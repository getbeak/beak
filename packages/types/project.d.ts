export interface ProjectFile {
	id: string;
	name: string;
	version: string;

	/**
	 * Legacy flag from the removed userData/untitled-projects/ scratch
	 * mechanism. Kept optional so old project.json files keep loading; the
	 * renderer ignores it.
	 */
	untitled?: boolean;
}
