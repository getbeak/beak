import type { VariableSet } from '@getbeak/types/variable-sets';
import path from 'path-browserify';

import { readJsonAndValidate } from '../fs';
import { ipcFsService } from '../ipc';
import { variableSetSchema } from './schema';

export async function readVariableSet(vgFilePath: string) {
	return await readJsonAndValidate<VariableSet>(vgFilePath, variableSetSchema);
}

export async function writeVariableSet(name: string, variableSet: VariableSet) {
	const filePath = path.join('variable-sets', `${name}.json`);

	await ipcFsService.writeJson(filePath, variableSet, { spaces: '\t' });
}

export async function removeVariableSet(name: string) {
	const filePath = path.join('variable-sets', `${name}.json`);

	await ipcFsService.remove(filePath);
}
