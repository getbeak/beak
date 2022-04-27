import { VariableGroup } from '@beak/shared-common/types/beak-project';
import path from 'path-browserify';

import { readJsonAndValidate } from '../fs';
import { ipcFsService } from '../ipc';
import { variableGroupSchema } from './schema';

export async function readVariableGroup(vgFilePath: string) {
	return await readJsonAndValidate<VariableGroup>(vgFilePath, variableGroupSchema);
}

export async function writeVariableGroup(name: string, variableGroup: VariableGroup) {
	const filePath = path.join('variable-groups', `${name}.json`);

	await ipcFsService.writeJson(filePath, variableGroup, { spaces: '\t' });
}

export async function removeVariableGroup(name: string) {
	const filePath = path.join('variable-groups', `${name}.json`);

	await ipcFsService.remove(filePath);
}
