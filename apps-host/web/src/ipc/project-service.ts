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

service.registerPromoteUntitled(async (_event, _payload) => {
	// Web host has no concept of moving folders across the user's real filesystem.
	// Until we wire OPFS / File System Access to a "Save As…" picker the renderer
	// just gets a null result, which it should surface as "not supported here".
	return null;
});
