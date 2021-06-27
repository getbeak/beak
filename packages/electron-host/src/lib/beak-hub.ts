import { RecentLocalProject } from '@beak/common/types/beak-hub';
import * as fs from 'fs-extra';
import * as path from 'path';

import persistentStore from './persistent-store';

export async function listRecentProjects(): Promise<RecentLocalProject[]> {
	const has = persistentStore.has('recents');

	if (!has)
		return [];

	const recents = persistentStore.get('recents');

	const promises = recents.map(async r => {
		const exists = await fs.pathExists(r.path);
		const projectFile = path.join(r.path, 'project.json');

		// Placeholder. Should never be seen as the UI should filter out projects that
		// do not exist..
		let accessTime = '1989-12-13T00:00:00Z';

		if (exists) {
			const pfStat = await fs.stat(projectFile);

			accessTime = pfStat.atime.toISOString();
		}

		return {
			...r,
			exists,
			accessTime,
		};
	});

	return await Promise.all(promises);
}

export async function addRecentProject(recent: Omit<RecentLocalProject, 'exists' | 'accessTime'>) {
	const recents = await listRecentProjects();
	const filteredRecents = recents.filter(r => r.path !== recent.path);

	persistentStore.set('recents', [recent, ...filteredRecents].map(r => ({
		type: r.type,
		name: r.name,
		path: r.path,
	})));
}
