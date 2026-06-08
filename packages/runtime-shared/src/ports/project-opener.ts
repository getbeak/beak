/**
 * Port: ProjectOpener
 *
 * Abstracts "show a folder picker, then validate and open the chosen
 * project" so that the behaviour is expressible in host-agnostic code.
 * Each shell supplies a concrete adapter:
 *
 *   Electron  — apps-host/electron/src/adapters/project-opener.ts
 *   Web       — apps-host/web/src/adapters/project-opener.ts
 *
 * The port deliberately says nothing about windows or navigation —
 * those remain the responsibility of the individual hosts.
 */
export default abstract class ProjectOpener {
	/**
	 * Show a native folder/file picker and return the chosen path, or
	 * `null` when the user cancels. The dialog implementation is entirely
	 * host-specific (Electron `dialog.showOpenDialog`, File System Access
	 * API `showDirectoryPicker`, etc.).
	 *
	 * An optional `browserWindow` hint is accepted but ignored on hosts
	 * that don't have a concept of window-parented dialogs.
	 */
	abstract pickProjectFolder(browserWindow?: unknown): Promise<string | null>;

	/**
	 * Validate that `projectPath` contains a readable Beak project, run
	 * migrations if needed, update the recents list and return the
	 * project's id + name + resolved folder path + project file path.
	 *
	 * Returns `null` when the path does not resolve to a valid project;
	 * the adapter is responsible for surfacing any user-visible error
	 * (alert/dialog/toast) before returning `null`.
	 *
	 * `silent` suppresses error dialogs — useful for automated re-open
	 * on startup where a missing project should fail quietly.
	 */
	abstract openProjectFolder(
		projectPath: string,
		silent?: boolean,
	): Promise<{ id: string; name: string; folder: string; filePath: string } | null>;
}
