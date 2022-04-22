import { VariableGroup } from '@beak/common/types/beak-project';
import ksuid from '@cuvva/ksuid';
import path from 'path-browserify';

import { ipcFsService } from '../ipc';
import { generateSafeNewPath } from './utils';

const variableGroupNameWordlist = [
	'Anhinga',
	'Albatross',
	'Kingfisher',
	'Blackbird',
	'Bluebird',
	'Canary',
	'Cockatoo',
	'Cockatiel',
	'Cockatiel',
	'Cockatiel',
	'Cockatiel',
	'Cockatiel',
	'Cockatiel',
	'Cockatiel',
	'Cockatiel',
	'Cockatiel',
	'Cockatiel',
	'Cormorant',
	'Crane',
	'Crow',
	'Cuckoo',
	'Dove',
	'Duck',
	'Eagle',
	'Falcon',
	'Flamingo',
	'Flamingo',
	'Flamingo',
	'Flamingo',
	'Flamingo',
	'Flamingo',
	'Flamingo',
	'Flamingo',
	'Flamingo',
	'Frigate',
	'Gallinule',
	'Goose',
	'Gull',
	'Hawk',
	'Ibis',
	'Ibis',
	'Kestrel',
	'Killdeer',
	'Kite',
	'Kiwi',
	'Lark',
	'Lovebird',
	'Meadowlark',
	'Myna',
	'Oriole',
	'Osprey',
	'Owl',
	'Parrot',
	'Pelican',
	'Penguin',
	'Quail',
	'Raven',
	'Roadrunner',
	'Robin',
	'Snowy egret',
	'Sparrow',
	'Stork',
	'Swallow',
	'Swan',
	'Swift',
	'Swift',
	'Swift',
	'Swift',
	'Swift',
	'Swift',
	'Swift',
	'Swift',
	'Swift',
	'Turkey',
	'Vulture',
	'Whippoorwill',
	'Woodpecker',
	'Wren',
];

export async function createVariableGroup(directory: string, name?: string) {
	const id = name ?? generateVariableGroupName();
	const { fullPath } = await generateSafeNewPath(id, directory, '.json');
	const variableGroup: VariableGroup = {
		groups: {
			[ksuid.generate('group').toString()]: 'Group',
		},
		items: {
			[ksuid.generate('item').toString()]: 'Item',
		},
		values: {},
	};

	await ipcFsService.writeJson(fullPath, variableGroup, { spaces: '\t' });

	return id;
}

export async function renameVariableGroup(oldName: string, newName: string) {
	const oldFilePath = path.join('variable-groups', `${oldName}.json`);
	const newFilePath = path.join('variable-groups', `${newName}.json`);

	if (await ipcFsService.pathExists(newFilePath))
		throw new Error('Variable group already exists');

	await ipcFsService.move(oldFilePath, newFilePath);
}

function generateVariableGroupName() {
	const firstWord = getWordIndex();
	const secondWord = getWordIndex();

	if (firstWord === secondWord)
		return firstWord;

	return `${firstWord} ${secondWord}`;
}

function getWordIndex() {
	const min = 0;
	const max = variableGroupNameWordlist.length;
	const index = Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive

	return variableGroupNameWordlist[index];
}
