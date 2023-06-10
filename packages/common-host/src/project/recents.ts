import { RecentProject } from '@beak/common/types/beak-hub';

import { BeakBase } from '../base';

export default class BeakRecents extends BeakBase {
	async listProjects() {
		const has = await this.p.storage.has('recents');

		if (!has)
			return [];

		const recents = await this.p.storage.get('recents');

		const resolved = await Promise.all(recents.map(async r => {
			const projectFilePath = this.p.node.path.join(r.path, 'project.json');

			// eslint-disable-next-line no-sync
			const projectFileExists = this.p.node.fs.existsSync(projectFilePath);

			if (!projectFileExists)
				return null;

			const pfStat = await this.p.node.fs.promises.stat(projectFilePath);
			const accessTime = pfStat.atime.toISOString();

			return {
				...r,
				accessTime,
			};
		}));

		return resolved.filter(Boolean) as RecentProject[];
	}

	async addProject(recent: Omit<RecentProject, 'exists' | 'accessTime'>) {
		const recents = await this.listProjects();
		const filteredRecents = recents.filter(r => r.path !== recent.path);

		// app.addRecentDocument(recent.path);

		await this.p.storage.set('recents', [recent, ...filteredRecents].map<RecentProject>(r => ({
			name: r.name,
			path: r.path,
			accessTime: new Date().toISOString(),
		})));
	}
}
