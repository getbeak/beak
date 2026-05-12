import { TypedObject } from '@beak/common/helpers/typescript';
import {
	insertNewGroup,
	insertNewItem,
	insertNewVariableGroup,
	removeGroup,
	removeItem,
	removeVariableGroupFromStore,
	startVariableGroups,
	updateGroupName,
	updateItemName,
	updateValue,
	variableGroupsOpened,
} from '@beak/core/variable-groups';
import { attemptReconciliation, changeTab } from '@beak/ui/features/tabs/store/actions';
import type { ActiveRename } from '@beak/ui/features/tree-view/types';
import { createVariableGroup, renameVariableGroup } from '@beak/ui/lib/beak-project/variable-groups';
import { readVariableGroup, removeVariableGroup, writeVariableGroup } from '@beak/ui/lib/beak-variable-group';
import createFsEmitter, { type FsSubscription, scanDirectoryRecursively } from '@beak/ui/lib/fs-emitter';
import { ipcDialogService, ipcFsService } from '@beak/ui/lib/ipc';
import type { VariableGroup, VariableGroups } from '@getbeak/types/variable-groups';
import path from 'path-browserify';
import * as uuid from 'uuid';
import type { AppStartListening } from '../listener';
import { editorPreferencesSetSelectedVariableGroup } from '../preferences/actions';
import * as vgActions from '../variable-groups/actions';
import { createNewVariableGroup, removeVariableGroupFromDisk, renameSubmitted } from '../variable-groups/actions';

export function registerVariableGroupsEffects(start: AppStartListening) {
	// start: initial import + long-running fs watcher on variable-groups/.
	start({
		actionCreator: startVariableGroups,
		effect: async (_action, api) => {
			await initialImport(api);

			const subscription: FsSubscription = createFsEmitter(
				'variable-groups',
				async event => {
					if (!['add', 'change', 'unlink'].includes(event.type)) return;
					if (path.extname(event.path) !== '.json') return;

					// Only read changes if they haven't been recently written by us.
					if (event.type === 'change') {
						const lastWrite = api.getState().global.variableGroups.latestWrite;
						if (lastWrite) {
							const expiry = lastWrite + 1000;
							if (expiry > Date.now()) return;
						}
					}

					if (event.type === 'add' || event.type === 'change') {
						try {
							const { file, name } = await readVariableGroup(event.path);
							api.dispatch(insertNewVariableGroup({ id: name, variableGroup: file as VariableGroup }));
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
							const variableGroupName = path.basename(event.path, path.extname(event.path));
							api.dispatch(removeVariableGroupFromStore(variableGroupName));
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
		insertNewVariableGroup,
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
				const variableGroup = api.getState().global.variableGroups.variableGroups[id];
				if (!variableGroup) return;

				const nonce = uuid.v4();
				api.dispatch(vgActions.setWriteDebounce(nonce));
				await api.delay(500);

				const debounce = api.getState().global.variableGroups.writeDebouncer;
				if (debounce !== nonce) return;

				api.dispatch(vgActions.setLatestWrite(Date.now()));
				await writeVariableGroup(id, variableGroup);
			},
		});
	}

	// Create a new variable group (then start rename UI once it appears in store).
	start({
		actionCreator: createNewVariableGroup,
		effect: async ({ payload }, api) => {
			const id = await createVariableGroup('variable-groups', payload.name);
			api.dispatch(changeTab({ type: 'variable_group_editor', payload: id, temporary: true }));
			await api.take(insertNewVariableGroup.match, 250);
			api.dispatch(vgActions.renameStarted({ id }));
		},
	});

	// Remove from disk (with confirm).
	start({
		actionCreator: removeVariableGroupFromDisk,
		effect: async ({ payload }, api) => {
			const { id, withConfirmation } = payload;

			if (withConfirmation) {
				const response = await ipcDialogService.showMessageBox({
					title: 'Deleting variable group',
					message: `You are about to delete '${id}' from your machine. Are you sure you want to continue?`,
					detail: 'This action is irreversible inside Beak!',
					type: 'warning',
					buttons: ['Remove', 'Cancel'],
					defaultId: 0,
				});
				if (response.response === 1) return;
			}

			await removeVariableGroup(id);
			api.dispatch(removeVariableGroupFromStore(id));
			api.dispatch(attemptReconciliation());
		},
	});

	// Rename submit.
	start({
		actionCreator: renameSubmitted,
		effect: async ({ payload }, api) => {
			const activeRename = api.getState().global.variableGroups.activeRename as ActiveRename | undefined;
			const { id } = payload;

			if (!activeRename || activeRename.id !== id) return;

			if (activeRename.name === activeRename.id) {
				api.dispatch(vgActions.renameResolved({ id }));
				return;
			}

			try {
				await renameVariableGroup(id, activeRename.name);
				api.dispatch(vgActions.renameResolved({ id }));
				await api.delay(200);
				api.dispatch(changeTab({ type: 'variable_group_editor', temporary: false, payload: activeRename.name }));
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
	getState: () => { global: { preferences: { editor: { selectedVariableGroups: Record<string, string> } } } };
	dispatch: (action: { type: string; [k: string]: unknown }) => unknown;
}) {
	const folderExists = await ipcFsService.pathExists('variable-groups');

	if (!folderExists) {
		api.dispatch(variableGroupsOpened({ variableGroups: {} }));
		return;
	}

	const items = await scanDirectoryRecursively('variable-groups');
	const files = items.filter(i => !i.isDirectory).map(i => i.path);
	const variableGroups = await readVariableGroups(files);
	const editorPreferences = api.getState().global.preferences.editor;

	for (const vgk of TypedObject.keys(variableGroups)) {
		const vg = variableGroups[vgk];
		if (editorPreferences.selectedVariableGroups[vgk] === void 0) {
			api.dispatch(
				editorPreferencesSetSelectedVariableGroup({
					variableGroup: vgk,
					groupId: TypedObject.keys(vg.groups)[0],
				}),
			);
		}
	}

	api.dispatch(variableGroupsOpened({ variableGroups }));
}

async function readVariableGroups(filePaths: string[]): Promise<VariableGroups> {
	const results = await Promise.all(filePaths.map(f => readVariableGroup(f)));
	return results.reduce((acc, { name, file }) => ({ ...acc, [name]: file as VariableGroup }), {} as VariableGroups);
}
