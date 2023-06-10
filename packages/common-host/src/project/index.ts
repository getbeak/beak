import { ProjectEncryption } from '@beak/common/types/beak-project';
import ksuid from '@beak/ksuid';
import type { RequestNodeFile } from '@getbeak/types/nodes';
import type { ProjectFile } from '@getbeak/types/project';
import type { VariableGroup } from '@getbeak/types/variable-groups';
import git from 'isomorphic-git';

import { BeakBase, Providers } from '../base';
import BeakExtensions from './extensions';
import BeakMigrations from './migrations';
import BeakRecents from './recents';

interface ReadProjectFileOptions {
	runExtensions?: boolean;
}

export default class BeakProject extends BeakBase {
	private readonly beakExtensions: BeakExtensions;
	private readonly beakMigrations: BeakMigrations;
	private readonly beakRecents: BeakRecents;

	constructor(providers: Providers) {
		super(providers);

		this.beakExtensions = new BeakExtensions(this.providers);
		this.beakMigrations = new BeakMigrations(this.providers, this.beakExtensions);
		this.beakRecents = new BeakRecents(this.providers);
	}

	async create(name: string, projectParentFolder: string) {
		const projectFolderPath = this.p.node.path.join(projectParentFolder, name);

		const defaultRequest: RequestNodeFile = {
			id: ksuid.generate('request').toString(),
			verb: 'get',
			url: ['https://httpbin.org/anything'],
			query: {},
			headers: {
				[ksuid.generate('header').toString()]: {
					enabled: true,
					name: 'X-Example-Header',
					value: ['Welcome to Beak!'],
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

		const productionGroupId = ksuid.generate('group').toString();
		const localGroupId = ksuid.generate('group').toString();
		const environmentIdentifierItemId = ksuid.generate('item').toString();

		const variableGroup: VariableGroup = {
			groups: {
				[productionGroupId]: 'Production',
				[localGroupId]: 'Local',
			},
			items: {
				[environmentIdentifierItemId]: 'env_identifier',
			},
			values: {
				[`${productionGroupId}&${environmentIdentifierItemId}`]: ['prod'],
				[`${localGroupId}&${environmentIdentifierItemId}`]: ['local'],
			},
		};

		// eslint-disable-next-line no-sync
		const projectFolderExists = this.p.node.fs.existsSync(projectFolderPath);

		if (projectFolderExists)
			throw new Error('Project folder already exists.');

		// Create project folder
		await this.p.node.fs.promises.mkdir(projectFolderPath);

		// Create tree structure
		await this.p.node.fs.promises.mkdir(
			this.p.node.path.join(projectFolderPath, 'tree'),
		);
		await this.p.node.fs.promises.writeFile(
			this.p.node.path.join(projectFolderPath, 'tree', 'Request.json'),
			JSON.stringify(defaultRequest, null, '\t'),
			'utf-8',
		);

		// Create variable groups structure
		await this.p.node.fs.promises.mkdir(
			this.p.node.path.join(projectFolderPath, 'variable-groups'),
		);
		await this.p.node.fs.promises.writeFile(
			this.p.node.path.join(projectFolderPath, 'variable-groups', 'Environment.json'),
			JSON.stringify(variableGroup, null, '\t'),
			'utf-8',
		);

		// Create extensions structure
		await this.p.node.fs.promises.mkdir(
			this.p.node.path.join(projectFolderPath, 'extensions'),
		);
		await this.p.node.fs.promises.writeFile(
			this.p.node.path.join(projectFolderPath, 'extensions', 'package.json'),
			JSON.stringify(this.beakExtensions.createPackageJsonContent(name), null, '\t'),
			'utf-8',
		);
		await this.p.node.fs.promises.writeFile(
			this.p.node.path.join(projectFolderPath, 'extensions', 'README.md'),
			this.beakExtensions.createReadmeContent(name),
			'utf-8',
		);

		// Create hidden project items
		await this.p.node.fs.promises.writeFile(
			this.p.node.path.join(projectFolderPath, '.gitignore'),
			JSON.stringify(this.createGitIgnore(), null, '\t'),
			'utf-8',
		);
		await this.p.node.fs.promises.mkdir(
			this.p.node.path.join(projectFolderPath, '.beak'),
		);
		await this.p.node.fs.promises.writeFile(
			this.p.node.path.join(projectFolderPath, '.beak', 'supersecret.json'),
			JSON.stringify(this.createGitIgnore(), null, '\t'),
			'utf-8',
		);

		// Create project root files
		await this.p.node.fs.promises.writeFile(
			this.p.node.path.join(projectFolderPath, 'README.md'),
			JSON.stringify(this.createReadme(name), null, '\t'),
			'utf-8',
		);

		const project = await this.createProjectFile(projectFolderPath, name);
		const [projectFile, projectFilePath] = project;

		await this.createProjectEncryption(projectFile.id);
		await this.setupGit(projectFolderPath);

		return { projectFilePath, projectId: projectFile.id };
	}

	async readProjectFile(projectFolderPath: string, opts?: ReadProjectFileOptions) {
		const options = { ...opts };
		const projectFilePath = this.p.node.path.join(projectFolderPath, 'project.json');

		// eslint-disable-next-line no-sync
		if (!this.p.node.fs.existsSync(projectFilePath))
			return null;

		const projectFileJson = await this.p.node.fs.promises.readFile(projectFilePath, 'utf-8');
		let projectFile: ProjectFile;

		try {
			// TODO(afr): validate schema of project file!
			projectFile = JSON.parse(projectFileJson) as ProjectFile;
		} catch {
			return null;
		}

		if (options.runExtensions)
			await this.beakMigrations.runMigrations(projectFile, projectFolderPath);

		return projectFile;
	}

	get recents() {
		return this.beakRecents;
	}

	private async createProjectEncryption(projectId: string) {
		const encryption: ProjectEncryption = {
			algorithm: this.p.aes.algorithmVersionMap['2020-01-25'],
			key: await this.p.aes.generateKey(),
		};

		await this.p.credentials.setProjectEncryptionKey(projectId, JSON.stringify(encryption));
	}

	private async createProjectFile(
		projectPath: string,
		name: string,
	): Promise<[ProjectFile, string]> {
		const projectFilePath = this.p.node.path.join(projectPath, 'project.json');
		const profileFile: ProjectFile = {
			id: ksuid.generate('project').toString(),
			name,
			version: '0.3.0',
		};

		await this.p.node.fs.promises.writeFile(
			projectFilePath,
			JSON.stringify(profileFile, null, '\t'),
			'utf-8',
		);

		return [profileFile, projectFilePath];
	}

	private createReadme(name: string) {
		return [
			`# ${name}`,
			'',
			'Welcome to your new Beak project! For help getting started, please visit the [Beak docs](https://docs.getbeak.app/).',
			'',
		].join('\n');
	}

	private createGitIgnore() {
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

	private async setupGit(projectPath: string) {
		await git.init({
			fs: this.p.node.fs,
			dir: projectPath,
			defaultBranch: 'master',
		});

		for await (const filePath of this.listFilesRecursive(projectPath)) {
			const relativePath = filePath.substr(projectPath.length + 1);

			await git.add({ fs: this.p.node.fs, dir: projectPath, filepath: relativePath });
		}

		// TODO(afr): Pull this from the current git config?
		await git.commit({
			fs: this.p.node.fs,
			dir: projectPath,
			message: 'Initial commit',
			author: {
				name: 'Pierre (Beak App)',
				email: 'pierre@getbeak.app',
			},
		});
	}

	private async *listFilesRecursive(dir: string): AsyncGenerator<string> {
		const dirents = await this.p.node.fs.promises.readdir(dir, { encoding: 'utf-8', withFileTypes: true });

		for (const dirent of dirents) {
			const res = this.p.node.path.resolve(dir, dirent.name);

			if (dirent.name === '.git')
				continue;

			if (dirent.isDirectory())
				yield* this.listFilesRecursive(res);
			else
				yield res;
		}
	}
}
