import type { RecentProject } from '@beak/common/types/beak-hub';
import { useCallback, useEffect, useState } from 'react';

import { ipcBeakHubService } from '../../../lib/ipc';

interface UseRecentProjectsResult {
	recents: RecentProject[];
	loading: boolean;
	error: string | null;
	reload: () => Promise<void>;
}

export function useRecentProjects(): UseRecentProjectsResult {
	const [recents, setRecents] = useState<RecentProject[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const reload = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const list = await ipcBeakHubService.listRecentProjects();
			list.sort((a, b) => {
				const at = Date.parse(a.accessTime);
				const bt = Date.parse(b.accessTime);
				return (Number.isNaN(bt) ? 0 : bt) - (Number.isNaN(at) ? 0 : at);
			});
			setRecents(list);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void reload();
	}, [reload]);

	return { recents, loading, error, reload };
}
