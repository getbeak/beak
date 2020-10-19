import fs from 'fs-extra';
import { validate } from 'jsonschema';
import path from 'path';
import process from 'process';

import { recentsSchema } from './schemas';
import { RecentLocalProject } from './types';

export async function listRecentProjects(): Promise<RecentLocalProject[]> {
	const wd = process.cwd();
	const recentsPath = path.join(wd, '.beak', 'recents.json');

	if (!await fs.pathExists(recentsPath))
		return [];

	const recents = await fs.readJson(recentsPath) as RecentLocalProject[];

	validate(recents, recentsSchema, { throwError: true });

	const promises = recents.map(async r => {
		const exists = await fs.pathExists(r.path);
		const projectFile = path.join(r.path, 'project.json');

		// Placeholder. Should never be seen as the UI should filter out projects that
		// do not exist..
		let modifiedTime = '1989-12-13T00:00:00Z';

		if (exists) {
			const pfStat = await fs.stat(projectFile);

			modifiedTime = pfStat.mtime.toISOString();
		}

		return {
			...r,
			exists,
			modifiedTime,
		};
	});

	return await Promise.all(promises);
}

export async function addRecentProject(recent: Omit<RecentLocalProject, 'exists' | 'modifiedTime'>) {
	const wd = process.cwd();
	const recentsPath = path.join(wd, '.beak', 'recents.json');
	const recents = await listRecentProjects();
	const filteredRecents = recents.filter(r => r.path !== recent.path);

	await fs.ensureFile(recentsPath);
	await fs.writeJson(recentsPath, [recent, ...filteredRecents].map(r => ({
		type: r.type,
		name: r.name,
		path: r.path,
	})));
}
