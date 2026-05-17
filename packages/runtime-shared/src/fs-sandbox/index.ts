import Squawk from '@beak/common/utils/squawk';

import { RuntimeBase } from '../base';
import type BeakProject from '../project';

/**
 * Sandbox helper called at the IPC boundary of every host. Every renderer
 * → host call that takes a path runs through here so a malicious renderer
 * can't reach outside the open project directory.
 *
 * Both hosts used to ship their own copy of this with subtle divergences:
 *  - Electron validated the project file's `id`/`version`/`name` and used
 *    `startsWith(projectDir + path.sep)` (safe).
 *  - Web delegated project parsing to `readProjectFile` and used
 *    `startsWith(projectDir)` alone — a real-prefix attack vector when a
 *    sibling folder name starts with the project directory name
 *    (`/p/Cool` matched `/p/Cool-evil/...`).
 *
 * Both surface the same Squawk codes; the renderer keys error UI on them,
 * so the surface stays compatible with the old behaviour on either host.
 */

export class FsSandbox extends RuntimeBase {
	/**
	 * Inject the BeakProject helper at construction so we don't import
	 * the project index directly (circular). The Runtime root passes its
	 * own `project` instance in.
	 */
	private readonly project: BeakProject;

	constructor(providers: ConstructorParameters<typeof RuntimeBase>[0], project: BeakProject) {
		super(providers);
		this.project = project;
	}

	/**
	 * Resolve `inputPath` relative to the project folder, validate that
	 * the project actually exists, and ensure the resolution stays inside
	 * the project root. Returns the absolute resolved path so the caller
	 * can hand it straight to `fs.readFile` etc.
	 *
	 * Throws Squawk codes:
	 *  - `path_not_project` — project.json missing
	 *  - `path_project_invalid` — project.json present but unparseable / missing required fields
	 *  - `path_not_within_project` — input resolves outside the project root
	 */
	async ensureWithinProject(projectFolderPath: string, inputPath: string): Promise<string> {
		const path = this.p.node.path;
		const projectFilePath = path.join(projectFolderPath, 'project.json');

		const projectFile = await this.project.readProjectFile(projectFolderPath);
		if (!projectFile) throw new Squawk('path_not_project', { projectFilePath, inputPath });

		if (!projectFile.id || !projectFile.version || !projectFile.name)
			throw new Squawk('path_project_invalid', { projectFilePath, inputPath });

		const projectDir = path.resolve(projectFolderPath);
		const resolved = path.resolve(path.join(projectDir, inputPath));
		// Safe-prefix check: exact dir hit OR a real descendant. The naive
		// `startsWith(projectDir)` allows sibling folders whose name shares
		// a prefix to slip through (`/p/Cool` matching `/p/Cool-evil/...`).
		// `path.sep` ensures we're at a path-segment boundary.
		const isWithinProject = resolved === projectDir || resolved.startsWith(projectDir + path.sep);
		if (!isWithinProject) throw new Squawk('path_not_within_project', { projectFilePath, inputPath });

		return resolved;
	}
}
