import { IpcProjectServiceMain } from '@beak/common/ipc/project';

import getBeakHost from '../host';
import { webIpcMain } from './ipc';

const service = new IpcProjectServiceMain(webIpcMain);

service.registerOpenFolder(async (_event, projectPath) => {
	const project = await getBeakHost().project.readProjectFile(projectPath, {
		runMigrations: true,
	});

	if (!project) {
		// eslint-disable-next-line no-alert
		alert('Unable to load project, the project you tried to open could not be found.');

		return;
	}

	if (!project.name) {
		// eslint-disable-next-line no-alert
		alert('Unable to load project, please check it is not corrupt and try again');

		return;
	}

	window.location.assign(`/project/${project.id}`);
});

service.registerOpenProject(async _event => {
	// eslint-disable-next-line no-alert
	alert('Not implemented: `registerOpenProject`');
});

service.registerCreateProject(async (_event, payload) => {
	const project = await getBeakHost().project.create(payload.projectName, '/', {
		useProjectIdAsProjectFolder: true,
	});

	window.setTimeout(() => window.location.assign(`/project/${project.projectId}`), 3000);

	// TODO(afr): Set active project variable?
});
