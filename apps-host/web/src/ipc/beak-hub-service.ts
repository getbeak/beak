import { IpcBeakHubServiceMain } from '@beak/common/ipc/beak-hub';

import getBeakHost, { getRootMode } from '../host';
import { webIpcMain } from './ipc';

const service = new IpcBeakHubServiceMain(webIpcMain);

/**
 * Recents are persisted across modes (OPFS-namespaced projects in OPFS mode,
 * the single FSA-mounted folder in FSA mode), but the *paths* in each entry
 * are only meaningful for the mode they were recorded in. Filter to entries
 * matching the active mode so clicking a recent never resolves to a path
 * that doesn't exist on the current root.
 */
service.registerListRecentProjects(async () => {
	const all = await getBeakHost().project.recents.listProjects();
	const mode = getRootMode();
	const visibleSource = mode === 'fsa' ? 'local-folder' : 'browser';

	return all.filter(r => (r.source ?? 'browser') === visibleSource);
});

service.registerGetRootSource(async () => (getRootMode() === 'fsa' ? 'local-folder' : 'browser'));
