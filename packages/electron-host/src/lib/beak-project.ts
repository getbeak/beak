import { TypedObject } from '@beak/common/src/helpers/typescript';
import { ProjectFile, RequestNodeFile, VariableGroup } from '@beak/common/types/beak-project';
// @ts-ignore
import * as ksuid from '@cuvva/ksuid';
import * as fs from 'fs-extra';
import * as path from 'path';
import simpleGit, { SimpleGitOptions } from 'simple-git';

import { encryptionAlgoVersions, generateKey } from './aes';

export interface CreationOptions {
	name: string;
	rootPath: string;
}

export default async function createProject(options: CreationOptions) {
	const { name, rootPath } = options;
	const projectPath = path.join(rootPath, name);

	const exReq: RequestNodeFile = {
		id: ksuid.generate('request').toString(),
		verb: 'get',
		url: ['https://httpbin.org/anything'],
		query: {
			[ksuid.generate('query').toString()]: {
				enabled: true,
				name: 'artist',
				value: ['Taylor Swift'],
			},
		},
		headers: {
			[ksuid.generate('header').toString()]: {
				enabled: true,
				name: 'X-Example-Header',
				value: ['bae'],
			},
		},
		body: {
			type: 'text',
			payload: '',
		},
	};

	const variableGroup: VariableGroup = {
		groups: {
			[ksuid.generate('group').toString()]: 'Production',
			[ksuid.generate('group').toString()]: 'Local',
		},
		items: {
			[ksuid.generate('item').toString()]: 'env_identifer',
		},
		values: {},
	};

	variableGroup.values[ksuid.generate('value').toString()] = {
		groupId: TypedObject.keys(variableGroup.groups)[0],
		itemId: TypedObject.keys(variableGroup.items)[0],
		value: 'prod',
	};
	variableGroup.values[ksuid.generate('value').toString()] = {
		groupId: TypedObject.keys(variableGroup.groups)[1],
		itemId: TypedObject.keys(variableGroup.items)[0],
		value: 'local',
	};

	if (await fs.pathExists(projectPath))
		throw new Error('project folder already exists');

	await fs.ensureDir(projectPath);
	await ensureDirEmpty(projectPath);
	await fs.ensureDir(path.join(projectPath, 'tree'));
	await fs.writeJson(path.join(projectPath, 'tree', 'Example request.json'), exReq, {
		spaces: '\t',
	});
	await fs.ensureDir(path.join(projectPath, 'variable-groups'));
	await fs.writeJson(path.join(projectPath, 'variable-groups', 'Environment.json'), variableGroup, {
		spaces: '\t',
	});
	await fs.writeFile(path.join(projectPath, '.gitignore'), createGitIgnore());
	await fs.ensureDir(path.join(projectPath, '.beak'));
	await fs.writeJson(path.join(projectPath, '.beak', 'supersecret.json'), {
		encryption: {
			algo: encryptionAlgoVersions['2020-01-25'],
			key: await generateKey(),
		},
	}, { spaces: '\t' });
	await fs.writeFile(path.join(projectPath, 'README.md'), createReadme(name));

	const projectFilePath = await createProjectFile(projectPath, name);

	await initRepoAndCommit(projectPath);

	return projectFilePath;
}

async function ensureDirEmpty(path: string) {
	const files = await fs.readdir(path);

	if (files.length !== 0)
		throw new Error('project directory not empty');
}

async function createProjectFile(projectPath: string, name: string) {
	const projectFilePath = path.join(projectPath, 'project.json');
	const file: ProjectFile = {
		name,
		version: '0.2.0',
	};

	await fs.writeJson(projectFilePath, file, { spaces: '\t' });

	return projectFilePath;
}

function createReadme(name: string) {
	return [
		`# ${name}`,
		'',
		'Welcome to your new Beak project! For getting started help, visit the [Beak docs](https://docs.getbeak.app/).',
		'',
	].join('\n');
}

function createGitIgnore() {
	return [
		'# Beak specific files',
		'.beak',
		'',
		'# Platform files',
		'.DS_Store',
		'Thumbs.db',
	].join('\n');
}

async function initRepoAndCommit(projectPath: string) {
	const options: SimpleGitOptions = {
		baseDir: projectPath,
		binary: 'git',
		maxConcurrentProcesses: 6,
	};

	const git = simpleGit(options);

	await git.init()
		.add('./*')
		.commit('Initial commit!');
}
