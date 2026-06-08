import { workflowSchema } from '@beak/state/schemas';
import type { WorkflowFile } from '@beak/state/workflows';
import path from 'path-browserify';

import { readJsonAndValidate } from '../../lib/fs';
import { ipcFsService } from '../../lib/ipc';

export const WORKFLOWS_DIR = 'workflows';

export async function readWorkflow(filePath: string) {
	return await readJsonAndValidate<WorkflowFile>(filePath, workflowSchema);
}

export async function writeWorkflow(id: string, workflow: WorkflowFile) {
	const filePath = path.join(WORKFLOWS_DIR, `${id}.json`);
	await ipcFsService.writeJson(filePath, workflow, { spaces: '\t' });
}

export async function removeWorkflow(id: string) {
	const filePath = path.join(WORKFLOWS_DIR, `${id}.json`);
	await ipcFsService.remove(filePath);
}

export async function ensureWorkflowsDir() {
	await ipcFsService.ensureDir(WORKFLOWS_DIR);
}
