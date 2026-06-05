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

	/**
	 * Project-wide cookie configuration. `primaryVariableSet` names the
	 * variable set whose currently-selected item drives the default
	 * cookie jar (the one outgoing requests pull from by default, the one
	 * incoming Set-Cookie headers always deposit into). Defaults to
	 * `'Environment'` when absent.
	 */
	cookies?: {
		primaryVariableSet?: string;
	};
}
