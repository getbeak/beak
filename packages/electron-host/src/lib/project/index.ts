import { TypedObject } from '@beak/common/helpers/typescript';
import { ProjectEncryption } from '@beak/common/types/beak-project';
import ksuid from '@beak/ksuid';
import { RequestNodeFile } from '@getbeak/types/nodes';
import { ProjectFile } from '@getbeak/types/project';
import { VariableGroup } from '@getbeak/types/variable-groups';
import { BrowserWindow, dialog, MessageBoxOptions, OpenDialogOptions } from 'electron';
import * as fs from 'fs-extra';
import git from 'isomorphic-git';
import * as path from 'path';

import { setProjectWindowMapping } from '../../ipc-layer/fs-shared';
import { createProjectMainWindow } from '../../window-management';
import { encryptionAlgoVersions, generateKey } from '../aes';
import { addRecentProject } from '../beak-hub';
import { setProjectEncryption } from '../credential-vault';
import persistentStore from '../persistent-store';
import { checkAndHandleMigrations } from './migrations';
import checkAndHandleSilentMigrations from './silent-migrations';

export const windowProjectIdMapping: Record<string, number> = { };

export interface CreationOptions {
	name: string;
	rootPath: string;
}

export async function tryOpenProjectFolder(projectFolderPath: string) {
	const projectFilePath = path.join(projectFolderPath, 'project.json');
	const projectFile = await readProjectFile(projectFolderPath);

	if (!projectFile) {
		await dialog.showMessageBox({
			title: 'Unable to load project',
			message: 'The project file you tried to open could not be found, maybe it was moved?',
			type: 'error',
		});

		return null;
	}

	if (!projectFile.name)
		return null;

	// Time to migrate for the winter
	await checkAndHandleMigrations(projectFile, projectFolderPath);

	// Time to migrate for the silent winter
	await checkAndHandleSilentMigrations(projectFolderPath);

	const projectMappings = persistentStore.get('projectMappings');

	persistentStore.set('projectMappings', { ...projectMappings, [projectFile.id]: projectFolderPath });
	await addRecentProject({
		name: projectFile.name,
		path: projectFolderPath,
		type: 'local',
	});

	const projectWindowId = createProjectMainWindow(projectFilePath);

	setProjectWindowMapping(projectWindowId, projectFilePath);
	windowProjectIdMapping[projectFile.id] = projectWindowId;

	return projectWindowId;
}

export async function openProjectDialog(browserWindow?: BrowserWindow) {
	const openDialogOptions: OpenDialogOptions = {
		title: 'Open a Beak project',
		buttonLabel: 'Open',
		properties: ['openFile'],
		filters: [
			{ name: 'Beak project', extensions: ['json'] },
		],
	};

	const openDialog = dialog.showOpenDialog;
	const result = await (browserWindow ? openDialog(browserWindow, openDialogOptions) : openDialog(openDialogOptions));

	if (result.canceled)
		return;

	if (result.filePaths.length !== 1) {
		const showMessageBox = dialog.showMessageBox;
		const showMessageOptions: MessageBoxOptions = {
			type: 'error',
			title: 'That shouldn\'t happen',
			message: 'You managed to select more than 1 file... pls don\'t do that.',
		};

		await (browserWindow ? showMessageBox(browserWindow, showMessageOptions) : showMessageBox(showMessageOptions));

		return;
	}

	const projectFolder = path.parse(result.filePaths[0]).dir;

	await tryOpenProjectFolder(projectFolder);
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
			[ksuid.generate('item').toString()]: 'env_identifier',
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
		},
	}, { spaces: '\t' });
	await fs.writeFile(path.join(projectPath, 'README.md'), createReadme(name));

	const [projectFile, projectFilePath] = await createProjectFile(projectPath, name);

	await createProjectEncryption(projectFile.id);
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

async function createProjectEncryption(projectId: string) {
	const encryption: ProjectEncryption = {
		algorithm: encryptionAlgoVersions['2020-01-25'],
		key: await generateKey(),
	};

	await setProjectEncryption(projectId, JSON.stringify(encryption));
}

async function createProjectFile(projectPath: string, name: string): Promise<[ProjectFile, string]> {
	const projectFilePath = path.join(projectPath, 'project.json');
	const file: ProjectFile = {
		id: ksuid.generate('project').toString(),
		name,
		version: '0.2.1',
	};

	await fs.writeJson(projectFilePath, file, { spaces: '\t' });

	return [file, projectFilePath];
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
		'',
	].join('\n');
}

async function initRepoAndCommit(projectPath: string) {
	await git.init({ fs, dir: projectPath, defaultBranch: 'master' });

	for await (const filePath of listFilesRecursive(projectPath)) {
		const relativePath = filePath.substr(projectPath.length + 1);

		await git.add({ fs, dir: projectPath, filepath: relativePath });
	}

	// TODO(afr): Make this from the current git config?
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

export async function readProjectFile(projectFolderPath: string) {
	const projectFilePath = path.join(projectFolderPath, 'project.json');

	if (!await fs.pathExists(projectFilePath))
		return null;

	return await fs.readJson(projectFilePath, { throws: false }) as ProjectFile | null;
}
