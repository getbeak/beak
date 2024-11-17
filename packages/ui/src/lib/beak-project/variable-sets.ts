import ksuid from '@beak/ksuid';
import type { VariableSet } from '@getbeak/types/variable-sets';
import path from 'path-browserify';

import { ipcFsService } from '../ipc';
import { generateSafeNewPath } from './utils';

const variableSetNameWordlist = [
	'Anhinga',
	'Albatross',
	'Kingfisher',
	'Blackbird',
	'Bluebird',
	'Canary',
	'Cockatoo',
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
	'Turkey',
	'Vulture',
	'Whippoorwill',
	'Woodpecker',
	'Wren',
];

export async function createVariableSet(directory: string, name?: string) {
	const id = name ?? generateVariableSetName();
	const { fullPath } = await generateSafeNewPath(id, directory, '.json');
	const variableSet: VariableSet = {
		sets: {
			[ksuid.generate('set').toString()]: 'Set',
		},
		items: {
			[ksuid.generate('item').toString()]: 'Item',
		},
		values: {},
	};

	await ipcFsService.writeJson(fullPath, variableSet, { spaces: '\t' });

	return id;
}

export async function renameVariableSet(oldName: string, newName: string) {
	const oldFilePath = path.join('variable-sets', `${oldName}.json`);
	const newFilePath = path.join('variable-sets', `${newName}.json`);

	if (await ipcFsService.pathExists(newFilePath))
		throw new Error('Variable set already exists');

	await ipcFsService.move(oldFilePath, newFilePath);
}

function generateVariableSetName() {
	const firstWord = getWordIndex();
	const secondWord = getWordIndex();

	if (firstWord === secondWord)
		return firstWord;

	return `${firstWord} ${secondWord}`;
}

function getWordIndex() {
	const min = 0;
	const max = variableSetNameWordlist.length;
	const index = Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive

	return variableSetNameWordlist[index];
}
