import { IpcProjectServiceMain } from '@beak/common/ipc/project';

import getBeakHost from '../host';
import { webIpcMain } from './ipc';

const service = new IpcProjectServiceMain(webIpcMain);

service.registerOpenFolder(async (_event, projectPath) => {
	const project = await getBeakHost().project.readProjectFile(projectPath, {
		runMigrations: true,
	});

	if (!project) {
		alert('Unable to load project, the project you tried to open could not be found.');

		return;
	}

	if (!project.name) {
		alert('Unable to load project, please check it is not corrupt and try again');

		return;
	}

	window.location.assign(`/project/${project.id}`);
});

service.registerOpenProject(async _event => {
	alert('Not implemented: `registerOpenProject`');
});

service.registerRenameProjectAtPath(async (_event, payload) => {
	if (!payload?.projectPath || typeof payload.name !== 'string') return false;
	return await getBeakHost().project.renameAtPath(payload.projectPath, payload.name);
});

service.registerRecordRecent(async (_event, payload) => {
	if (!payload?.name || !payload?.path || !payload?.source) return false;

	await getBeakHost().project.recents.addProject({
		name: payload.name,
		path: payload.path,
		source: payload.source,
	});

	return true;
});

service.registerCreateProject(async (_event, payload) => {
	const project = await getBeakHost().project.create(payload.projectName, '/', {
		useProjectIdAsProjectFolder: true,
		// lightning-fs over IndexedDB makes git.init+commit unbearably slow
		// (10+ seconds for even a 5-file project). The web host doesn't
		// expose git anyway, so skip the setup.
		skipGit: true,
	});

	// lightning-fs debounces its superblock save by 500ms (PromisifiedFS).
	// If we navigate away before it flushes, the next page boot reads an
	// in-memory superblock that doesn't know about the just-written files
	// and we end up in a redirect loop. Force a flush before reload.
	const fs = getBeakHost().p.node.fs as unknown as {
		promises?: { flush?: () => Promise<void> };
	};
	if (fs.promises?.flush) await fs.promises.flush();

	window.location.assign(`/project/${project.projectId}`);
});
