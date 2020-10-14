// @ts-ignore
import ksuid from '@cuvva/ksuid';
import fs from 'fs-extra';
import path from 'path';

import { ProjectFile, RequestNodeFile } from './types';

export interface CreationOptions {
	name: string;
	rootPath: string;
}

export default async function createProject(options: CreationOptions) {
	const { name, rootPath } = options;
	const projectPath = path.join(rootPath, name);

	const exReq: RequestNodeFile = {
		id: ksuid.generate('request').toString(),
		name: 'Example request',
		uri: {
			protocol: 'https:',
			verb: 'get',
			hostname: 'httpbin.org',
			path: '/anything',
			query: {
				[ksuid.generate('query').toString()]: {
					enabled: true,
					name: 'artist',
					value: 'Taylor Swift',
				},
			},
			fragment: null,
		},
		headers: {
			[ksuid.generate('header').toString()]: {
				enabled: true,
				name: 'X-Example-Header',
				value: 'bae',
			},
		},
	};

	if (await fs.pathExists(projectPath))
		throw new Error('project folder already exists');

	await fs.ensureDir(projectPath);
	await ensureDirEmpty(projectPath);
	await fs.ensureDir(path.join(projectPath, 'tree'));
	await fs.writeJson(path.join(projectPath, 'tree', `${exReq.id}.json`), exReq, {
		replacer: null,
		spaces: '\t',
	});
	await fs.writeFile(path.join(projectPath, '.gitignore'), '.beak\n');
	await fs.ensureDir(path.join(projectPath, '.beak'));
	await fs.writeFile(path.join(projectPath, '.beak', 'supersecret.json'), '{}');

	// TODO(afr): invoke git
	// TODO(afr): create readme?

	return await createProjectFile(projectPath, name);
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
		version: '1.0.0',
	};

	await fs.writeJson(projectFilePath, file, { spaces: '\t' });

	return projectFilePath;
}
