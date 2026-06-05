import { describe, expect, it } from 'vitest';

import { CURRENT_WORKFLOW_VERSION, migrateWorkflow, type WorkflowMigration } from '../migrate';
import type { WorkflowFile } from '../types';

const baseWorkflow: Omit<WorkflowFile, 'version'> = {
	id: 'wf',
	name: 'test',
	nodes: [{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} }],
	edges: [],
};

describe('migrateWorkflow', () => {
	it('stamps the current version on a legacy file with no version', () => {
		const migrated = migrateWorkflow(baseWorkflow as WorkflowFile);
		expect(migrated.version).toBe(CURRENT_WORKFLOW_VERSION);
	});

	it('passes through files already at the current version', () => {
		const input: WorkflowFile = { ...baseWorkflow, version: CURRENT_WORKFLOW_VERSION };
		const migrated = migrateWorkflow(input);
		expect(migrated.version).toBe(CURRENT_WORKFLOW_VERSION);
		expect(migrated.id).toBe('wf');
	});

	it('is idempotent — running twice returns the same shape', () => {
		const once = migrateWorkflow(baseWorkflow as WorkflowFile);
		const twice = migrateWorkflow(once);
		expect(twice).toEqual(once);
	});

	it('walks a multi-step migration chain (synthetic chain via injection)', () => {
		const synthetic: WorkflowMigration[] = [
			{ from: '1', to: '2', transform: wf => ({ ...wf, version: '2', name: `${wf.name} (v2)` }) },
			{ from: '2', to: '3', transform: wf => ({ ...wf, version: '3', name: `${wf.name} (v3)` }) },
		];
		const input: WorkflowFile = { ...baseWorkflow, version: '1' };
		const migrated = migrateWorkflow(input, synthetic);
		expect(migrated.version).toBe('3');
		expect(migrated.name).toBe('test (v2) (v3)');
	});

	it('safety-caps at 100 iterations if a migration accidentally loops', () => {
		const loop: WorkflowMigration[] = [
			// from=='1' transforms to {version: '1', ...} — same version, so the
			// chain matches itself forever. The cap prevents stack blow-up.
			{ from: '1', to: '1', transform: wf => ({ ...wf }) },
		];
		const input: WorkflowFile = { ...baseWorkflow, version: '1' };
		const migrated = migrateWorkflow(input, loop);
		// Doesn't throw, doesn't hang.
		expect(migrated.version).toBe('1');
	});
});
