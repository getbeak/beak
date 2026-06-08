import { ipcGitService } from '@beak/ui/lib/ipc';

/**
 * Auto-stage everything that has drifted from the index OR is untracked,
 * and remove any deleted files from the index.
 *
 * Mirrors `git add -A && git commit`. The renderer can drive a richer
 * per-file workflow later; for now a single Commit button captures the
 * whole working tree.
 */
export async function autoStageAll(dir: string): Promise<void> {
	const status = await ipcGitService.statusMatrix({ dir });

	for (const [filepath, head, workdir, stage] of status.rows) {
		const drifted = workdir > 0 && workdir !== stage;
		const untracked = head === 0 && workdir > 0;
		const deleted = head !== 0 && workdir === 0;

		if (drifted || untracked) {
			await ipcGitService.add({ dir, filepath });
		} else if (deleted) {
			await ipcGitService.remove({ dir, filepath });
		}
	}
}
