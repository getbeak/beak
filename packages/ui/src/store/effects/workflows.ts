import ksuid from '@beak/ksuid';
import { instantiateTemplate, type WorkflowFile } from '@beak/state/workflows';
import { changeTab } from '@beak/ui/features/tabs/store/actions';
import {
	ensureWorkflowsDir,
	readWorkflow,
	removeWorkflow,
	WORKFLOWS_DIR,
	writeWorkflow,
} from '@beak/ui/lib/beak-workflow';
import createFsEmitter, { type FsSubscription, scanDirectoryRecursively } from '@beak/ui/lib/fs-emitter';
import { ipcDialogService, ipcFsService } from '@beak/ui/lib/ipc';
import path from 'path-browserify';
import * as uuid from 'uuid';

import type { AppStartListening } from '../listener';
import * as wfActions from '../workflows/actions';
import {
	addEdge,
	addNode,
	clearGraph,
	createNewWorkflow,
	duplicateNode,
	insertNewWorkflow,
	moveNode,
	removeEdge,
	removeNode,
	removeNodes,
	removeWorkflowFromDisk,
	removeWorkflowFromStore,
	renameNode,
	replaceGraph,
	setWorkflowParent,
	startWorkflows,
	updateEdgeLabel,
	updateNode,
	updateNodeData,
	updateWorkflowName,
	workflowsOpened,
} from '../workflows/actions';

export function registerWorkflowsEffects(start: AppStartListening) {
	// startWorkflows: initial import + long-running fs watcher on `workflows/`.
	start({
		actionCreator: startWorkflows,
		effect: async (_action, api) => {
			await initialImport(api);

			const subscription: FsSubscription = createFsEmitter(
				WORKFLOWS_DIR,
				async event => {
					if (!['add', 'change', 'unlink'].includes(event.type)) return;
					if (path.extname(event.path) !== '.json') return;

					if (event.type === 'change') {
						const lastWrite = api.getState().global.workflows.latestWrite;
						if (lastWrite) {
							const expiry = lastWrite + 1000;
							if (expiry > Date.now()) return;
						}
					}

					if (event.type === 'add' || event.type === 'change') {
						try {
							const { file } = await readWorkflow(event.path);
							api.dispatch(insertNewWorkflow({ id: file.id, workflow: file }));
						} catch (error) {
							if (!(error instanceof Error)) return;
							await ipcDialogService.showMessageBox({
								type: 'error',
								title: 'Project data error',
								message: 'There was a problem reading a workflow file in your project',
								detail: [error.message, error.stack].join('\n'),
							});
						}
					} else if (event.type === 'unlink') {
						try {
							const id = path.basename(event.path, path.extname(event.path));
							api.dispatch(removeWorkflowFromStore(id));
						} catch (error) {
							if (!(error instanceof Error)) return;
							await ipcDialogService.showMessageBox({
								type: 'error',
								title: 'Project data error',
								message: 'There was a problem deleting a workflow from your project',
								detail: [error.message, error.stack].join('\n'),
							});
						}
					}
				},
				{ depth: 0, followSymlinks: false },
			);

			void subscription;
		},
	});

	// Persist workflow edits with a 500ms write debounce. Reused across every
	// mutating action so a flurry of node-drag events coalesces into one write.
	const updateActions = [
		insertNewWorkflow,
		updateWorkflowName,
		setWorkflowParent,
		addNode,
		updateNode,
		updateNodeData,
		moveNode,
		removeNode,
		removeNodes,
		renameNode,
		duplicateNode,
		addEdge,
		removeEdge,
		updateEdgeLabel,
		replaceGraph,
		clearGraph,
	];
	for (const ac of updateActions) {
		start({
			actionCreator: ac,
			effect: async ({ payload }, api) => {
				if (api.getState().global.project.mode !== 'disk') return;

				const id = (payload as { id: string }).id;
				const workflow = api.getState().global.workflows.workflows[id];
				if (!workflow) return;

				const nonce = uuid.v4();
				api.dispatch(wfActions.setWriteDebounce(nonce));
				await api.delay(500);

				const debounce = api.getState().global.workflows.writeDebouncer;
				if (debounce !== nonce) return;

				api.dispatch(wfActions.setLatestWrite(Date.now()));
				await writeWorkflow(id, workflow);
			},
		});
	}

	// Create a new workflow: synthesise locally (via the template helper), open
	// the tab, persist on disk projects via the debounced effect above. The
	// template defaults to 'blank' so the no-arg path stays a single Start node.
	start({
		actionCreator: createNewWorkflow,
		effect: async ({ payload }, api) => {
			const name = payload.name ?? 'Untitled workflow';
			const workflow: WorkflowFile = instantiateTemplate({
				template: payload.template ?? 'blank',
				name,
				parent: payload.parent ?? null,
				mintId: prefix => ksuid.generate(prefix).toString(),
			});

			if (api.getState().global.project.mode === 'disk') {
				await ensureWorkflowsDir();
			}

			api.dispatch(insertNewWorkflow({ id: workflow.id, workflow }));
			api.dispatch(changeTab({ type: 'workflow_editor', payload: workflow.id, temporary: false }));
		},
	});

	// Delete from disk (with confirm).
	start({
		actionCreator: removeWorkflowFromDisk,
		effect: async ({ payload }, api) => {
			const { id, withConfirmation } = payload;
			const mode = api.getState().global.project.mode;
			const workflow = api.getState().global.workflows.workflows[id];
			const display = workflow?.name ?? id;

			if (mode === 'disk' && withConfirmation) {
				const response = await ipcDialogService.showMessageBox({
					title: 'Delete workflow',
					message: `You are about to delete “${display}” from your machine. Are you sure you want to continue?`,
					detail: 'This action is irreversible inside Beak!',
					type: 'warning',
					buttons: ['Remove', 'Cancel'],
					defaultId: 1,
					cancelId: 1,
				});
				if (response.response === 1) return;
			}

			if (mode === 'disk') await removeWorkflow(id);
			api.dispatch(removeWorkflowFromStore(id));
		},
	});
}

async function initialImport(api: { dispatch: (action: { type: string; [k: string]: unknown }) => unknown }) {
	const folderExists = await ipcFsService.pathExists(WORKFLOWS_DIR);

	if (!folderExists) {
		api.dispatch(workflowsOpened({ workflows: {} }));
		return;
	}

	const items = await scanDirectoryRecursively(WORKFLOWS_DIR);
	const files = items.filter(i => !i.isDirectory).map(i => i.path);

	const results = await Promise.all(
		files.map(async f => {
			try {
				const { file } = await readWorkflow(f);
				return { ok: true as const, file };
			} catch (err) {
				return { ok: false as const, filePath: f, error: err };
			}
		}),
	);

	const workflows: Record<string, WorkflowFile> = {};
	const failures: { filePath: string; error: unknown }[] = [];

	for (const r of results) {
		if (r.ok) {
			workflows[r.file.id] = r.file;
		} else {
			failures.push({ filePath: r.filePath, error: r.error });
		}
	}

	api.dispatch(workflowsOpened({ workflows }));

	if (failures.length > 0) {
		console.warn(`[workflows] ${failures.length} file${failures.length === 1 ? '' : 's'} failed to load`, failures);
	}
}
