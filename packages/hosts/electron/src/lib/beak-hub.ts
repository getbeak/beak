import { RecentLocalProject } from '@beak/shared-common/types/beak-hub';
import { app } from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';

import persistentStore from './persistent-store';

export async function listRecentProjects(): Promise<RecentLocalProject[]> {
	const has = persistentStore.has('recents');

	if (!has)
		return [];

	const recents = persistentStore.get('recents');

	const promises = recents.map(async r => {
		const projectFilePath = path.join(r.path, 'project.json');
		const projectFileExists = await fs.pathExists(projectFilePath);

		if (!projectFileExists)
			return null;

		const pfStat = await fs.stat(projectFilePath);
		const accessTime = pfStat.atime.toISOString();

		return {
			...r,
			accessTime,
		};
	});

	const resolved = await Promise.all(promises);

	return resolved.filter(Boolean) as RecentLocalProject[];
}

export async function addRecentProject(recent: Omit<RecentLocalProject, 'exists' | 'accessTime'>) {
	const recents = await listRecentProjects();
	const filteredRecents = recents.filter(r => r.path !== recent.path);

	app.addRecentDocument(recent.path);

	persistentStore.set('recents', [recent, ...filteredRecents].map(r => ({
		type: r.type,
		name: r.name,
		path: r.path,
	})));
}
