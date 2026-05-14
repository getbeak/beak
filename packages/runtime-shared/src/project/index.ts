import ksuid from '@beak/ksuid';
import type { RequestNodeFile } from '@getbeak/types/nodes';
import type { ProjectFile } from '@getbeak/types/project';
import type { VariableSet } from '@getbeak/types/variable-sets';
import git from 'isomorphic-git';

import { BeakBase, type Providers } from '../base';
import { fileExists } from '../utils/fs';
import BeakExtensions from './extensions';
import BeakMigrations from './migrations';
import BeakRecents from './recents';

interface CreateProjectOptions {
	useProjectIdAsProjectFolder?: boolean;
	/** Do not add the new project to the recents list (used by untitled scratch projects). */
	skipRecents?: boolean;
	/** Mark the resulting project.json with `untitled: true`. */
	untitled?: boolean;
	/**
	 * Skip the `git init` + initial commit step. The web host's
	 * lightning-fs filesystem can take 10+ seconds to commit even a tiny
	 * project (each blob hash + tree write is round-tripped through an
	 * IndexedDB transaction), so the web host opts out and treats git
	 * features as out-of-scope.
	 */
	skipGit?: boolean;
}

interface ReadProjectFileOptions {
	runMigrations?: boolean;
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

	async create(name: string, projectParentFolder: string, opts?: CreateProjectOptions) {
		const options: CreateProjectOptions = { ...opts };
		const projectId = ksuid.generate('project').toString();

		const projectFolderPath = this.p.node.path.join(
			projectParentFolder,
			options.useProjectIdAsProjectFolder ? projectId : name,
		);

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

		const productionSetId = ksuid.generate('set').toString();
		const stagingSetId = ksuid.generate('set').toString();
		const developmentSetId = ksuid.generate('set').toString();
		const localSetId = ksuid.generate('set').toString();
		const environmentIdentifierItemId = ksuid.generate('item').toString();

		const variableSet: VariableSet = {
			sets: {
				[productionSetId]: 'Production',
				[stagingSetId]: 'Staging',
				[developmentSetId]: 'Development',
				[localSetId]: 'Local',
			},
			items: {
				[environmentIdentifierItemId]: 'env_identifier',
			},
			values: {
				[`${productionSetId}&${environmentIdentifierItemId}`]: ['production'],
				[`${stagingSetId}&${environmentIdentifierItemId}`]: ['staging'],
				[`${developmentSetId}&${environmentIdentifierItemId}`]: ['development'],
				[`${localSetId}&${environmentIdentifierItemId}`]: ['local'],
			},
		};

		if (await fileExists(this, projectFolderPath))
			throw new Error('Project folder already exists');

		// Create project folder
		await this.p.node.fs.promises.mkdir(projectFolderPath, { recursive: true });

		// Create tree structure
		await this.p.node.fs.promises.mkdir(this.p.node.path.join(projectFolderPath, 'tree'));
		await this.p.node.fs.promises.writeFile(
			this.p.node.path.join(projectFolderPath, 'tree', '_collection.json'),
			JSON.stringify({ source: { type: 'manual' } }, null, '\t'),
			'utf8',
		);
		await this.p.node.fs.promises.writeFile(
			this.p.node.path.join(projectFolderPath, 'tree', 'Request.json'),
			JSON.stringify(defaultRequest, null, '\t'),
			'utf8',
		);

		// Create variable sets structure
		await this.p.node.fs.promises.mkdir(
			this.p.node.path.join(projectFolderPath, 'variable-sets'),
		);
		await this.p.node.fs.promises.writeFile(
			this.p.node.path.join(projectFolderPath, 'variable-sets', 'Environment.json'),
			JSON.stringify(variableSet, null, '\t'),
			'utf8',
		);

		// Create extensions structure
		await this.p.node.fs.promises.mkdir(
			this.p.node.path.join(projectFolderPath, 'extensions'),
		);
		await this.p.node.fs.promises.writeFile(
			this.p.node.path.join(projectFolderPath, 'extensions', 'package.json'),
			JSON.stringify(this.beakExtensions.createPackageJsonContent(name), null, '\t'),
			'utf8',
		);
		await this.p.node.fs.promises.writeFile(
			this.p.node.path.join(projectFolderPath, 'extensions', 'README.md'),
			this.beakExtensions.createReadmeContent(name),
			'utf8',
		);

		// Create hidden project items
		await this.p.node.fs.promises.writeFile(
			this.p.node.path.join(projectFolderPath, '.gitignore'),
			this.createGitIgnore(),
			'utf8',
		);
		await this.p.node.fs.promises.mkdir(
			this.p.node.path.join(projectFolderPath, '.beak'),
		);

		// Create project root files
		await this.p.node.fs.promises.writeFile(
			this.p.node.path.join(projectFolderPath, 'README.md'),
			this.createReadme(name),
			'utf8',
		);

		const project = await this.createProjectFile(projectFolderPath, name, projectId, options.untitled);
		const [projectFile, projectFilePath] = project;

		await this.createProjectEncryption(projectFile.id);
		if (!options.skipGit) await this.setupGit(projectFolderPath);

		if (!options.skipRecents) {
			await this.beakRecents.addProject({
				name,
				path: projectFolderPath,
			});
		}

		return { projectFilePath, projectId: projectFile.id };
	}

	/**
	 * Move an untitled project folder into a permanent location and clear the
	 * `untitled` flag. Caller is responsible for re-opening the project window
	 * at the new path; this method only touches the filesystem and recents.
	 */
	async promoteUntitled(currentFolderPath: string, targetFolderPath: string, newName?: string) {
		const currentProjectFile = await this.readProjectFile(currentFolderPath);
		if (!currentProjectFile)
			throw new Error(`promoteUntitled: no project at ${currentFolderPath}`);
		if (!currentProjectFile.untitled)
			throw new Error(`promoteUntitled: project at ${currentFolderPath} is not untitled`);

		if (await fileExists(this, targetFolderPath))
			throw new Error(`promoteUntitled: target folder ${targetFolderPath} already exists`);

		await this.p.node.fs.promises.rename(currentFolderPath, targetFolderPath);

		const promoted: ProjectFile = {
			id: currentProjectFile.id,
			name: newName ?? currentProjectFile.name,
			version: currentProjectFile.version,
		};

		await this.p.node.fs.promises.writeFile(
			this.p.node.path.join(targetFolderPath, 'project.json'),
			JSON.stringify(promoted, null, '\t'),
			'utf8',
		);

		await this.beakRecents.addProject({
			name: promoted.name,
			path: targetFolderPath,
		});

		return { projectId: promoted.id, projectFilePath: this.p.node.path.join(targetFolderPath, 'project.json') };
	}

	async readProjectFile(projectFolderPath: string, opts?: ReadProjectFileOptions) {
		const options: ReadProjectFileOptions = { ...opts };
		const projectFilePath = this.p.node.path.join(projectFolderPath, 'project.json');

		if (!await fileExists(this, projectFilePath))
			return null;

		const projectFileJson = await this.p.node.fs.promises.readFile(projectFilePath, 'utf8');
		let projectFile: ProjectFile;

		try {
			// TODO(afr): validate schema of project file!
			projectFile = JSON.parse(projectFileJson) as ProjectFile;
		} catch {
			return null;
		}

		if (options.runMigrations)
			await this.beakMigrations.runMigrations(projectFile, projectFolderPath);

		return projectFile;
	}

	get recents() {
		return this.beakRecents;
	}

	private async createProjectEncryption(projectId: string) {
		await this.p.credentials.setProjectEncryption(projectId, {
			algorithm: this.p.aes.algorithmVersionMap['2020-01-25'],
			key: await this.p.aes.generateKey(),
		});
	}

	private async createProjectFile(
		projectPath: string,
		name: string,
		projectId?: string,
		untitled = false,
	): Promise<[ProjectFile, string]> {
		const projectFilePath = this.p.node.path.join(projectPath, 'project.json');
		const profileFile: ProjectFile = {
			id: projectId ?? ksuid.generate('project').toString(),
			name,
			version: '0.5.0',
			...(untitled ? { untitled: true } : {}),
		};

		await this.p.node.fs.promises.writeFile(
			projectFilePath,
			JSON.stringify(profileFile, null, '\t'),
			'utf8',
		);

		return [profileFile, projectFilePath];
	}

	private createReadme(name: string) {
		return [
			`# ${name}`,
			'',
			'**Welcome to this new Beak project!**',
			'',
			'For help getting started, please visit the[Beak docs](https://docs.getbeak.app/).',
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

	private async* listFilesRecursive(dir: string): AsyncGenerator<string> {
		const dirents = await this.p.node.fs.promises.readdir(dir, { encoding: 'utf8', withFileTypes: true });

		for (const dirent of dirents) {
			const direntPath = typeof dirent === 'string' ? dirent : dirent.name;
			const resolvedPath = this.p.node.path.resolve(dir, direntPath);

			const stat = await this.p.node.fs.promises.stat(resolvedPath);

			if (direntPath === '.git')
				continue;

			if (stat.isDirectory())
				yield* this.listFilesRecursive(resolvedPath);
			else
				yield resolvedPath;
		}
	}
}
