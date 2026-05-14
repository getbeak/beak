import { TypedObject } from '@beak/common/helpers/typescript';
import { attemptReconciliation, changeTab } from '@beak/ui/features/tabs/store/actions';
import type { ActiveRename } from '@beak/ui/features/tree-view/types';
import { createVariableSet, renameVariableSet } from '@beak/ui/lib/beak-project/variable-sets';
import { readVariableSet, removeVariableSet, writeVariableSet } from '@beak/ui/lib/beak-variable-set';
import createFsEmitter, { type FsSubscription, scanDirectoryRecursively } from '@beak/ui/lib/fs-emitter';
import { ipcDialogService, ipcFsService } from '@beak/ui/lib/ipc';
import type { VariableSet, VariableSets } from '@getbeak/types/variable-sets';
import path from 'path-browserify';
import * as uuid from 'uuid';
import type { AppStartListening } from '../listener';
import { editorPreferencesSetSelectedVariableGroup } from '../preferences/actions';
import * as vgActions from '../variable-sets/actions';
import {
	createNewVariableSet,
	insertNewGroup,
	insertNewItem,
	insertNewVariableSet,
	removeGroup,
	removeItem,
	removeVariableSetFromDisk,
	removeVariableSetFromStore,
	renameSubmitted,
	startVariableSets,
	updateGroupName,
	updateItemName,
	updateValue,
	variableSetsOpened,
} from '../variable-sets/actions';

export function registerVariableSetsEffects(start: AppStartListening) {
	// start: initial import + long-running fs watcher on variable-sets/.
	start({
		actionCreator: startVariableSets,
		effect: async (_action, api) => {
			await initialImport(api);

			const subscription: FsSubscription = createFsEmitter(
				'variable-sets',
				async event => {
					if (!['add', 'change', 'unlink'].includes(event.type)) return;
					if (path.extname(event.path) !== '.json') return;

					// Only read changes if they haven't been recently written by us.
					if (event.type === 'change') {
						const lastWrite = api.getState().global.variableSets.latestWrite;
						if (lastWrite) {
							const expiry = lastWrite + 1000;
							if (expiry > Date.now()) return;
						}
					}

					if (event.type === 'add' || event.type === 'change') {
						try {
							const { file, name } = await readVariableSet(event.path);
							api.dispatch(insertNewVariableSet({ id: name, variableSet: file as VariableSet }));
						} catch (error) {
							if (!(error instanceof Error)) return;
							await ipcDialogService.showMessageBox({
								type: 'error',
								title: 'Project data error',
								message: 'There was a problem reading a variable group file in your project',
								detail: [error.message, error.stack].join('\n'),
							});
						}
					} else if (event.type === 'unlink') {
						try {
							const variableSetName = path.basename(event.path, path.extname(event.path));
							api.dispatch(removeVariableSetFromStore(variableSetName));
							api.dispatch(attemptReconciliation());
						} catch (error) {
							if (!(error instanceof Error)) return;
							await ipcDialogService.showMessageBox({
								type: 'error',
								title: 'Project data error',
								message: 'There was a problem deleting a variable group from your project',
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

	// Persist variable-group changes with a 500ms write debounce.
	const updateActions = [
		insertNewVariableSet,
		insertNewGroup,
		insertNewItem,
		updateGroupName,
		updateItemName,
		updateValue,
		removeGroup,
		removeItem,
	];
	for (const ac of updateActions) {
		start({
			actionCreator: ac,
			effect: async ({ payload }, api) => {
				const id = (payload as { id: string }).id;
				const variableSet = api.getState().global.variableSets.variableSets[id];
				if (!variableSet) return;

				const nonce = uuid.v4();
				api.dispatch(vgActions.setWriteDebounce(nonce));
				await api.delay(500);

				const debounce = api.getState().global.variableSets.writeDebouncer;
				if (debounce !== nonce) return;

				api.dispatch(vgActions.setLatestWrite(Date.now()));
				await writeVariableSet(id, variableSet);
			},
		});
	}

	// Create a new variable group (then start rename UI once it appears in store).
	start({
		actionCreator: createNewVariableSet,
		effect: async ({ payload }, api) => {
			const id = await createVariableSet('variable-sets', payload.name);
			api.dispatch(changeTab({ type: 'variable_set_editor', payload: id, temporary: true }));
			await api.take(insertNewVariableSet.match, 250);
			api.dispatch(vgActions.renameStarted({ id }));
		},
	});

	// Remove from disk (with confirm).
	start({
		actionCreator: removeVariableSetFromDisk,
		effect: async ({ payload }, api) => {
			const { id, withConfirmation } = payload;

			if (withConfirmation) {
				const response = await ipcDialogService.showMessageBox({
					title: 'Delete variable set',
					message: `You are about to delete “${id}” from your machine. Are you sure you want to continue?`,
					detail: 'This action is irreversible inside Beak!',
					type: 'warning',
					buttons: ['Remove', 'Cancel'],
					defaultId: 1,
					cancelId: 1,
				});
				if (response.response === 1) return;
			}

			await removeVariableSet(id);
			api.dispatch(removeVariableSetFromStore(id));
			api.dispatch(attemptReconciliation());
		},
	});

	// Rename submit.
	start({
		actionCreator: renameSubmitted,
		effect: async ({ payload }, api) => {
			const activeRename = api.getState().global.variableSets.activeRename as ActiveRename | undefined;
			const { id } = payload;

			if (!activeRename || activeRename.id !== id) return;

			if (activeRename.name === activeRename.id) {
				api.dispatch(vgActions.renameResolved({ id }));
				return;
			}

			try {
				await renameVariableSet(id, activeRename.name);
				api.dispatch(vgActions.renameResolved({ id }));
				await api.delay(200);
				api.dispatch(changeTab({ type: 'variable_set_editor', temporary: false, payload: activeRename.name }));
			} catch (error) {
				if (error instanceof Error && error.message === 'Folder already exists') {
					await ipcDialogService.showMessageBox({
						title: 'Already exists!',
						message: 'The variable group name you specified already exists, please try something else.',
						type: 'info',
					});
					return;
				}
				await ipcDialogService.showMessageBox({
					title: 'Rename unsuccessful',
					message: 'There was an unknown error while attempting to rename this variable group',
					type: 'error',
				});
			}
		},
	});
}

async function initialImport(api: {
	getState: () => { global: { preferences: { editor: { selectedVariableSets: Record<string, string> } } } };
	dispatch: (action: { type: string; [k: string]: unknown }) => unknown;
}) {
	const folderExists = await ipcFsService.pathExists('variable-sets');

	if (!folderExists) {
		api.dispatch(variableSetsOpened({ variableSets: {} }));
		return;
	}

	const items = await scanDirectoryRecursively('variable-sets');
	const files = items.filter(i => !i.isDirectory).map(i => i.path);
	const { variableSets, failures } = await readVariableSets(files);
	const editorPreferences = api.getState().global.preferences.editor;

	for (const vgk of TypedObject.keys(variableSets)) {
		const vg = variableSets[vgk];
		if (editorPreferences.selectedVariableSets[vgk] === void 0) {
			api.dispatch(
				editorPreferencesSetSelectedVariableGroup({
					variableSet: vgk as string,
					setId: TypedObject.keys(vg.sets)[0] as string,
				}),
			);
		}
	}

	// Always dispatch `variableSetsOpened` so the project finishes booting
	// even when some files failed to load — otherwise the loading splash
	// hangs forever (see `useProjectLoading`).
	api.dispatch(variableSetsOpened({ variableSets }));

	if (failures.length > 0) {
		console.warn(`[variable-sets] ${failures.length} file${failures.length === 1 ? '' : 's'} failed to load`, failures);
		void ipcDialogService.showMessageBox({
			type: 'warning',
			title: 'Some variable sets failed to load',
			message: `${failures.length} variable set file${failures.length === 1 ? '' : 's'} could not be parsed.`,
			detail: failures
				.map(f => {
					const fieldErrors = (f.error.meta.fieldErrors ?? {}) as Record<string, string>;
					const fieldLines = Object.entries(fieldErrors)
						.map(([path, msg]) => `  • ${path}: ${msg}`)
						.join('\n');
					return `${f.filePath}\n${fieldLines || `  ${f.error.message}`}`;
				})
				.join('\n\n'),
		});
	}
}

interface ReadFailure {
	filePath: string;
	error: import('@beak/common/utils/squawk').BeakError;
}

async function readVariableSets(filePaths: string[]): Promise<{
	variableSets: VariableSets;
	failures: ReadFailure[];
}> {
	const results = await Promise.all(
		filePaths.map(async f => {
			try {
				const { name, file } = await readVariableSet(f);
				return { ok: true as const, name, file };
			} catch (err) {
				return { ok: false as const, filePath: f, error: err };
			}
		}),
	);

	const variableSets: VariableSets = {};
	const failures: ReadFailure[] = [];

	for (const r of results) {
		if (r.ok) {
			variableSets[r.name] = r.file as VariableSet;
		} else {
			const { BeakError } = await import('@beak/common/utils/squawk');
			failures.push({ filePath: r.filePath, error: BeakError.coerce(r.error) });
		}
	}

	return { variableSets, failures };
}
