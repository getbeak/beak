import { describe, expect, it } from 'vitest';

import { CURRENT_WORKFLOW_VERSION, migrateWorkflow } from '../migrate';
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
});
