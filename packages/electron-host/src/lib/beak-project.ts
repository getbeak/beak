import { TypedObject } from '@beak/common/src/helpers/typescript';
import { ProjectFile, RequestNodeFile, VariableGroup } from '@beak/common/types/beak-project';
import * as ksuid from '@cuvva/ksuid';
import * as fs from 'fs-extra';
import git from 'isomorphic-git';
import * as path from 'path';

import { encryptionAlgoVersions, generateKey } from './aes';
import { addRecentProject } from './beak-hub';

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
		query: {},
		headers: {
			[ksuid.generate('header').toString()]: {
				enabled: true,
				name: 'X-Example-Header',
				value: ['Taylor Swift'],
			},
		},
		body: {
			type: 'text',
			payload: '',
		},
		options: {
			followRedirects: false,
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

	variableGroup.values[`${TypedObject.keys(variableGroup.groups)[0]}&${TypedObject.keys(variableGroup.items)[0]}`] = ['prod'];
	variableGroup.values[`${TypedObject.keys(variableGroup.groups)[1]}&${TypedObject.keys(variableGroup.items)[1]}`] = ['local'];

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
	await addRecentProject({
		name,
		path: projectPath,
		type: 'local',
	});

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
		id: ksuid.generate('project').toString(),
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
		'Welcome to your new Beak project! For help getting started, please visit the [Beak docs](https://docs.getbeak.app/).',
		'',
	].join('\n');
}

function createGitIgnore() {
	return [
		'# Beak specific files, DO NOT REMOVE THIS',
		'.beak',
		'',
		'# Platform files',
		'.DS_Store',
		'Thumbs.db',
	].join('\n');
}

async function initRepoAndCommit(projectPath: string) {
	await git.init({ fs, dir: projectPath, defaultBranch: 'master' });

	for await (const filePath of listFilesRecursive(projectPath)) {
		const relativePath = filePath.substr(projectPath.length + 1);

		await git.add({ fs, dir: projectPath, filepath: relativePath });
	}

	await git.commit({
		fs,
		dir: projectPath,
		message: 'Initial commit',
		author: {
			name: 'Pierre (Beak App)',
			email: 'pierre@getbeak.app',
		},
	});
}

async function* listFilesRecursive(dir: string): AsyncGenerator<string> {
	const dirents = await fs.readdir(dir, { withFileTypes: true });

	for (const dirent of dirents) {
		const res = path.resolve(dir, dirent.name);

		if (dirent.name === '.git')
			continue;

		if (dirent.isDirectory())
			yield* listFilesRecursive(res);
		else
			yield res;
	}
}
