import { VariableGroup } from '@beak/common/types/beak-project';

import { readJsonAndValidate } from '../fs';
import { variableGroupSchema } from './schema';

const { remote } = window.require('electron');
const fs = remote.require('fs-extra');
const path = remote.require('path');

export async function readVariableGroup(vgFilePath: string) {
	return await readJsonAndValidate<VariableGroup>(vgFilePath, variableGroupSchema);
}

export async function writeVariableGroup(name: string, variableGroup: VariableGroup, vgFilePath: string) {
	const filePath = path.join(vgFilePath, `${name}.json`);

	await fs.writeJson(filePath, variableGroup, { spaces: '\t' });
}

export async function removeVariableGroup(name: string, vgFilePath: string) {
	const filePath = path.join(vgFilePath, `${name}.json`);

	await fs.remove(filePath);
}
