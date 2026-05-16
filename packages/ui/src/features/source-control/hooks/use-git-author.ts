import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'app.getbeak.beak.git-author';

export interface GitAuthor {
	name: string;
	email: string;
}

const empty: GitAuthor = { name: '', email: '' };

function readStored(): GitAuthor {
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return empty;
		const parsed = JSON.parse(raw) as Partial<GitAuthor>;
		return {
			name: typeof parsed.name === 'string' ? parsed.name : '',
			email: typeof parsed.email === 'string' ? parsed.email : '',
		};
	} catch {
		return empty;
	}
}

/**
 * Per-machine git author identity. Lives in localStorage to keep the
 * source-control UI standalone — adding it to the host's preferences
 * store would require new defaults + IPC + a migration, and it'd still
 * be machine-local. If we later want to sync this across devices we
 * can promote it then.
 */
export function useGitAuthor() {
	const [author, setAuthorState] = useState<GitAuthor>(() => readStored());

	const setAuthor = useCallback((next: GitAuthor) => {
		setAuthorState(next);
		try {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		} catch {
			/* quota or disabled storage — ignore */
		}
	}, []);

	// Sync across tabs / windows on web. Electron's renderer windows are
	// independent processes so this is a no-op there, but cheap.
	useEffect(() => {
		function onStorage(event: StorageEvent) {
			if (event.key !== STORAGE_KEY) return;
			setAuthorState(readStored());
		}
		window.addEventListener('storage', onStorage);
		return () => window.removeEventListener('storage', onStorage);
	}, []);

	return { author, setAuthor };
}
