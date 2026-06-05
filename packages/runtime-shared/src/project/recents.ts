import type { RecentProject, RecentProjectSource } from '@beak/common/types/beak-hub';

import { BeakBase, type Providers } from '../base';

export default class BeakRecents extends BeakBase {
	/**
	 * Each host injects what its recents *natively* look like (electron →
	 * `desktop`, web → `browser`) so legacy entries without a stored `source`
	 * field don't render as the wrong type after this field landed.
	 */
	constructor(
		providers: Providers,
		private readonly defaultSource: RecentProjectSource = 'desktop',
	) {
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
					// Existence probe — drop entries whose folder is gone. We
					// intentionally ignore stat times here: the stored accessTime
					// already reflects when the user last opened the project via
					// Beak, which is what "recent" should mean. Some filesystems
					// (OPFS in the web host) don't track atime/mtime on
					// directories at all and would return epoch 0 → "56 years
					// ago" in the UI.
					await this.p.node.fs.promises.stat(projectFilePath);

					return {
						...r,
						accessTime: validAccessTime(r.accessTime) ?? new Date().toISOString(),
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
		const has = await this.p.storage.has('recents');
		const existing = has ? await this.p.storage.get('recents') : [];
		const others = existing.filter(r => r.path !== recent.path);
		const source = recent.source ?? this.defaultSource;

		// TODO(afr): Find a way to add project to app recent document list on electron
		// app.addRecentDocument(recent.path);

		// Only stamp the entry being added — leaving the rest alone preserves
		// the true last-opened ordering. (Previously every entry got
		// re-stamped to "now" on every add.)
		const head: RecentProject = {
			name: recent.name,
			path: recent.path,
			accessTime: new Date().toISOString(),
			source,
		};

		await this.p.storage.set('recents', [head, ...others]);
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

function validAccessTime(value: string | undefined): string | undefined {
	if (!value) return undefined;
	const parsed = Date.parse(value);
	if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
	return value;
}
