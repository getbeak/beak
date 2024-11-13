import { RecentProject } from '@beak/common/types/beak-hub';

import { BeakBase } from '../base';

export default class BeakRecents extends BeakBase {
	async listProjects() {
		const has = await this.p.storage.has('recents');

		if (!has)
			return [];

		const recents = await this.p.storage.get('recents');
		const resolved = await Promise.all(recents.map(async r => {
			const projectFilePath = r.path;

			try {
				const pfStat = await this.p.node.fs.promises.stat(projectFilePath);
				const accessTime = (pfStat.atime?.toISOString() ?? new Date(pfStat.mtimeMs).toISOString());

				return {
					...r,
					accessTime,
				};
			} catch (error) {
				if (error instanceof Error) {
					if ('code' in error && typeof error.code === 'string' && ['ENOENT', 'ENOTDIR'].includes(error.code))
						return null;
				}

				throw error;
			}
		}));

		return resolved.filter(Boolean) as RecentProject[];
	}

	async addProject(recent: Omit<RecentProject, 'exists' | 'accessTime'>) {
		const recents = await this.listProjects();
		const filteredRecents = recents.filter(r => r.path !== recent.path);

		// TODO(afr): Find a way to add project to app recent document list on electron
		// app.addRecentDocument(recent.path);

		await this.p.storage.set('recents', [recent, ...filteredRecents].map<RecentProject>(r => ({
			name: r.name,
			path: r.path,
			accessTime: (new Date()).toISOString(),
		})));
	}
}
