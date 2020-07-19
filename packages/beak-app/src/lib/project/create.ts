import { ProjectFile } from './types';

const fs = window.require('fs-extra');
const path = window.require('path');

export interface CreationOptions {
	name: string;
	projectPath: string;
}

export default async function createProject(options: CreationOptions) {
	const { name, projectPath } = options;

	await fs.ensureDir(projectPath);
	await ensureDirEmpty(projectPath);
	await createProjectFile(projectPath, name)
	await fs.ensureDir(path.join(projectPath, 'tree'));
}

async function ensureDirEmpty(path: string) {
	const files = await fs.readdir(path);

	if (files.length !== 0)
		throw new Error('Project directory not empty');
}

async function createProjectFile(projectPath: string, name: string) {
	const file: ProjectFile = {
		name,
		version: '1.0.0',
	};

	fs.writeJson(path.join(projectPath, 'project.json'), file);
}
