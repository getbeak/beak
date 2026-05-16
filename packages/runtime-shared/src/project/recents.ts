import type { RecentProject, RecentProjectSource } from '@beak/common/types/beak-hub';

import { BeakBase, type Providers } from '../base';

export default class BeakRecents extends BeakBase {
	/**
	 * Each host injects what its recents *natively* look like (electron →
	 * `desktop`, web → `browser`) so legacy entries without a stored `source`
	 * field don't render as the wrong type after this field landed.
	 */
	constructor(providers: Providers, private readonly defaultSource: RecentProjectSource = 'desktop') {
		super(providers);
	}

	async listProjects() {
		const has = await this.p.storage.has('recents');

		if (!has) return [];

		const recents = await this.p.storage.get('recents');
		const resolved = await Promise.all(
			recents.map(async r => {
				const projectFilePath = r.path;
				const source = r.source ?? this.defaultSource;

				try {
					const pfStat = await this.p.node.fs.promises.stat(projectFilePath);
					const accessTime = pfStat.atime?.toISOString() ?? new Date(pfStat.mtimeMs).toISOString();

					return {
						...r,
						accessTime,
						source,
					};
				} catch (error) {
					if (error instanceof Error) {
						if ('code' in error && typeof error.code === 'string' && ['ENOENT', 'ENOTDIR'].includes(error.code)) return null;
					}

					throw error;
				}
			}),
		);

		return resolved.filter(Boolean) as RecentProject[];
	}

	async addProject(recent: Omit<RecentProject, 'exists' | 'accessTime'>) {
		const recents = await this.listProjects();
		const filteredRecents = recents.filter(r => r.path !== recent.path);
		const source = recent.source ?? this.defaultSource;

		// TODO(afr): Find a way to add project to app recent document list on electron
		// app.addRecentDocument(recent.path);

		await this.p.storage.set(
			'recents',
			[{ ...recent, source }, ...filteredRecents].map<RecentProject>(r => ({
				name: r.name,
				path: r.path,
				accessTime: new Date().toISOString(),
				source: r.source ?? this.defaultSource,
			})),
		);
	}

	async renameProject(projectPath: string, name: string) {
		const has = await this.p.storage.has('recents');
		if (!has) return;

		const recents = await this.p.storage.get('recents');
		await this.p.storage.set(
			'recents',
			recents.map(r => (r.path === projectPath ? { ...r, name } : r)),
		);
	}
}
