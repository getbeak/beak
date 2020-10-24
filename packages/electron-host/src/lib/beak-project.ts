import { ProjectFile, RequestNodeFile } from '@beak/common/types/beak-project';
// @ts-ignore
import * as ksuid from '@cuvva/ksuid';
import * as fs from 'fs-extra';
import * as path from 'path';
import simpleGit, { SimpleGitOptions } from 'simple-git';

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
		uri: {
			protocol: 'https:',
			hostname: 'httpbin.org',
			port: '',
			pathname: '/anything',
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
		body: {
			type: 'text',
			payload: '',
		},
	};

	if (await fs.pathExists(projectPath))
		throw new Error('project folder already exists');

	await fs.ensureDir(projectPath);
	await ensureDirEmpty(projectPath);
	await fs.ensureDir(path.join(projectPath, 'tree'));
	await fs.writeJson(path.join(projectPath, 'tree', 'Example request.json'), exReq, {
		replacer: null,
		spaces: '\t',
	});
	await fs.writeFile(path.join(projectPath, '.gitignore'), '.beak\n');
	await fs.ensureDir(path.join(projectPath, '.beak'));
	await fs.writeFile(path.join(projectPath, '.beak', 'supersecret.json'), '{}');
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
		version: '0.0.1',
	};

	await fs.writeJson(projectFilePath, file, { spaces: '\t' });

	return projectFilePath;
}

function createReadme(name: string) {
	return [
		`# ${name}`,
		'',
		'Welcome to your new Beak project',
		'',
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
