import { IpcFsWatcherServiceMain, type StartWatchingReq } from '@beak/common/ipc/fs-watcher';
import type { WebContents } from 'electron';

import getBeakHost from '../host';
import type OpfsFs from '../host/opfs-fs';
import { ensureWithinProject } from './fs-service';
import { platformNormalizePath } from './fs-shared';
import { webIpcMain } from './ipc';
import { getCurrentProjectFolder } from './utils';

interface Session {
	sender: WebContents;
	watchPath: string;
	projectFolder: string;
}

const sessions = new Map<string, Session>();
const service = new IpcFsWatcherServiceMain(webIpcMain);

// Subscribe once at module load. OpfsFs emits chokidar-shaped events
// (`add`/`change`/`unlink`/`addDir`/`unlinkDir`) every time its writeFile,
// unlink, mkdir, or rmdir surface mutates. We fan those out to every
// session whose watch path covers the changed path.
//
// The runtime types `node.fs` as the Node fs surface; the web host actually
// hands us an OpfsFs which adds `onChange`. Cast at the boundary.
(getBeakHost().p.node.fs as unknown as OpfsFs).onChange(event => {
	if (sessions.size === 0) return;

	for (const [sessionIdentifier, session] of sessions) {
		if (!isUnder(event.path, session.watchPath)) continue;

		const relative = stripProjectPrefix(event.path, session.projectFolder);
		service.sendWatcherEvent(session.sender, sessionIdentifier, {
			eventName: event.eventName,
			path: platformNormalizePath(relative),
		});
	}
});

service.registerStartWatching(async (_event, payload: StartWatchingReq) => {
	const projectFolder = getCurrentProjectFolder();
	if (!projectFolder) return;

	const watchPath = await ensureWithinProject(projectFolder, payload.filePath);

	sessions.set(payload.sessionIdentifier, {
		sender: webIpcMain.webContents,
		watchPath,
		projectFolder,
	});
});

service.registerStopWatching(async (_event, sessionIdentifier: string) => {
	sessions.delete(sessionIdentifier);
});

function isUnder(eventPath: string, watchPath: string): boolean {
	if (eventPath === watchPath) return true;
	return eventPath.startsWith(`${watchPath}/`);
}

function stripProjectPrefix(eventPath: string, projectFolder: string): string {
	if (eventPath === projectFolder) return '';
	if (eventPath.startsWith(`${projectFolder}/`)) return eventPath.slice(projectFolder.length + 1);
	return eventPath;
}
