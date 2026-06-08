import ProjectOpener from '@beak/runtime-shared/ports/project-opener';

import getRuntime from '../host';

export default class WebProjectOpener extends ProjectOpener {
	/**
	 * The web host does not have a concept of a project-file path in the
	 * traditional sense — projects live under OPFS or a user-picked FSA
	 * directory, both of which surface via the in-app welcome UI rather
	 * than a native OS file picker. This method is intentionally a no-op
	 * and always returns `null`; the welcome-screen flow goes through the
	 * IPC `openFolder` / `createProject` channels instead.
	 */
	async pickProjectFolder(): Promise<string | null> {
		return null;
	}

	async openProjectFolder(
		projectPath: string,
		_silent = false,
	): Promise<{ id: string; name: string; folder: string; filePath: string } | null> {
		const project = await getRuntime().project.readProjectFile(projectPath, {
			runMigrations: true,
		});

		if (!project) {
			alert('Unable to load project, the project you tried to open could not be found.');

			return null;
		}

		if (!project.name) {
			alert('Unable to load project, please check it is not corrupt and try again');

			return null;
		}

		return { id: project.id, name: project.name, folder: projectPath, filePath: `${projectPath}/project.json` };
	}
}
