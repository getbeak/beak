import type { WorkflowFile } from './types';

/**
 * Workflow file migration chain. The renderer reads workflows from disk
 * via the file watcher; pre-1.0 files have no `version` field, current
 * files write `'1'`. The migrator walks the chain from the file's
 * version up to the current, applying each transform in order.
 *
 * Today there's no real transform — every file parses cleanly under
 * the latest schema and just gets stamped with `version: '1'` if it
 * was missing one. Future schema changes register a transform here.
 *
 * Pure, deterministic, idempotent: calling `migrateWorkflow(wf)` twice
 * returns the same shape.
 */

export const CURRENT_WORKFLOW_VERSION = '1';

export interface WorkflowMigration {
	from: string;
	to: string;
	transform: (wf: WorkflowFile) => WorkflowFile;
}

const builtinMigrations: WorkflowMigration[] = [
	// Future migrations push onto this array. Example:
	// { from: '1', to: '2', transform: wf => ({ ...wf, version: '2', /* shape change */ }) },
];

/**
 * Runs the chain. `migrations` defaults to the built-in list; tests
 * pass a synthetic list to assert the wiring works end-to-end without
 * coupling to whatever's currently shipped.
 */
export function migrateWorkflow(
	wf: WorkflowFile,
	migrations: ReadonlyArray<WorkflowMigration> = builtinMigrations,
): WorkflowFile {
	let current: WorkflowFile = wf.version ? wf : { ...wf, version: CURRENT_WORKFLOW_VERSION };
	for (let safety = 0; safety < 100; safety++) {
		const next = migrations.find(m => m.from === current.version);
		if (!next) break;
		current = next.transform(current);
	}
	return current;
}
