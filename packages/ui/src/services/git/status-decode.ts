import type { GitFileStatus, GitStatusSummary } from '@beak/state/git';

/**
 * Roll up isomorphic-git's status matrix into the slice-friendly summary.
 *
 * Matrix codes are `[filepath, HEAD, WORKDIR, STAGE]` where:
 *   HEAD:    0 = absent, 1 = present
 *   WORKDIR: 0 = absent, 1 = identical to HEAD, 2 = different
 *   STAGE:   0 = absent, 1 = identical to HEAD, 2 = identical to WORKDIR, 3 = different
 *
 * From there:
 *   staged    = stage !== head (something is queued for the next commit)
 *   unstaged  = workdir > 0 && workdir !== stage (working tree drifts from index)
 *   untracked = head === 0 && workdir > 0 (file is new — never seen by git)
 *   deleted   = head !== 0 && workdir === 0 (gone from disk; staging may differ)
 */
export function decodeStatusMatrix(rows: Array<[string, 0 | 1, 0 | 1 | 2, 0 | 1 | 2 | 3]>): GitStatusSummary {
	const files: GitFileStatus[] = [];
	let staged = 0;
	let unstaged = 0;
	let untracked = 0;

	for (const [filepath, head, workdir, stage] of rows) {
		const isStaged = stage !== head;
		const isUnstaged = workdir > 0 && workdir !== stage;
		const isUntracked = head === 0 && workdir > 0;
		const isDeleted = head !== 0 && workdir === 0;
		if (!isStaged && !isUnstaged && !isUntracked && !isDeleted) continue;
		files.push({ filepath, staged: isStaged, unstaged: isUnstaged, untracked: isUntracked, deleted: isDeleted });
		if (isStaged) staged++;
		if (isUnstaged) unstaged++;
		if (isUntracked) untracked++;
	}

	return { staged, unstaged, untracked, files, updatedAt: new Date().toISOString() };
}
