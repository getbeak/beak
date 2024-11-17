/* eslint-disable @typescript-eslint/naming-convention */

import { ProjectEncryption } from '@beak/common/types/beak-project';
import { BeakBase, Providers } from '@beak/common-host/base';
import { fileExists } from '@beak/common-host/utils/fs';
import { ProjectFile } from '@getbeak/types/project';

import BeakExtensions from '../extensions';

interface MigrationHandler {
	(projectFile: ProjectFile, projectFolderPath: string): Promise<void>;
}

interface SupersecretFile {
	encryption: {
		algo: 'aes-256-ctr';
		key: string;
	};
}

// When creating a new migration, don't forget to update `latestSupported`
// -> `packages/app/src/lib/beak-project/project.ts`

export default class BeakStandardMigrations extends BeakBase {
	private readonly beakExtensions: BeakExtensions;

	private readonly migrationHistory: Record<string, MigrationHandler> = {
		'0.2.0': this.handle_0_2_0_to_0_2_1.bind(this), // Migrate from 0.2.0 -> 0.2.1
		'0.2.1': this.handle_0_2_1_to_0_3_0.bind(this), // Migrate from 0.2.1 -> 0.3.0
		'0.3.0': this.handle_0_3_0_to_0_4_0.bind(this), // Migrate from 0.3.0 -> 0.4.0
	} as const;

	constructor(providers: Providers, beakExtensions: BeakExtensions) {
		super(providers);

		this.beakExtensions = beakExtensions;
	}

	async runMigrations(projectFile: ProjectFile, projectFolderPath: string) {
		const migrations = Object.keys(this.migrationHistory);
		const migrationIndex = migrations.indexOf(projectFile.version);

		// Check if we even need to do a migration
		if (migrationIndex === -1)
			return;

		for (let i = migrationIndex; i < migrations.length; i++) {
			const migrationKey = migrations[i];
			const migration = this.migrationHistory[migrationKey];

			if (!migration) {
				this.p.logger.error('migration: migration handler not found!', { i, migrationKey });

				break;
			}

			// eslint-disable-next-line no-await-in-loop
			await migration(projectFile, projectFolderPath);
		}
	}

	/**
	 * Handles the migration of a project file from version 0.2.0 to 0.2.1.
	 *
	 * This function checks for the existence of a `supersecret.json` file in the project's `.beak` directory.
	 * If the file exists, it reads and parses the file to extract encryption details.
	 * The extracted encryption details are then set for the project using the `setProjectEncryption` method.
	 * Finally, the `supersecret.json` file is removed and the project file version is updated to 0.2.1.
	 *
	 * @param projectFile - The project file object that needs to be migrated.
	 * @param projectFolderPath - The path to the project folder.
	 * @returns A promise that resolves when the migration is complete.
	 */
	private async handle_0_2_0_to_0_2_1(projectFile: ProjectFile, projectFolderPath: string): Promise<void> {
		const supersecretFilePath = this.p.node.path.join(projectFolderPath, '.beak', 'supersecret.json');

		// Only try and migrate if supersecret exists...
		if (!await fileExists(this, supersecretFilePath)) return;

		try {
			const ssfContent = await this.p.node.fs.promises.readFile(supersecretFilePath, 'utf8');
			const ssf = JSON.parse(ssfContent) as SupersecretFile;

			if (ssf && ssf.encryption && ssf.encryption.algo && ssf.encryption.key) {
				const encryption: ProjectEncryption = {
					algorithm: ssf.encryption.algo,
					key: ssf.encryption.key,
				};

				await this.p.credentials.setProjectEncryption(projectFile.id, encryption);
			}
		} finally {
			await this.p.node.fs.promises.rm(supersecretFilePath, { force: true });
			await this.changeProjectFileVersion(projectFile, projectFolderPath, '0.2.1');
		}
	}

	/**
	 * Handles the migration of a project file from version 0.2.1 to 0.3.0.
	 *
	 * This function checks if the 'extensions' directory exists within the project folder.
	 * If the directory does not exist, it creates the directory and adds a 'package.json'
	 * and 'README.md' file with the appropriate content.
	 *
	 * Finally, it updates the project file version to '0.3.0'.
	 *
	 * @param projectFile - The project file to be migrated.
	 * @param projectFolderPath - The path to the project folder.
	 * @returns A promise that resolves when the migration is complete.
	 */
	private async handle_0_2_1_to_0_3_0(projectFile: ProjectFile, projectFolderPath: string): Promise<void> {
		const extensionsPath = this.p.node.path.join(projectFolderPath, 'extensions');

		let hasExtensions = true;

		if (!await fileExists(this, extensionsPath))
			hasExtensions = true;

		// Only try and migrate if extensions don't exist... May be left over from beta testers
		if (!hasExtensions) {
			await this.p.node.fs.promises.mkdir(extensionsPath);

			await Promise.all([
				await this.p.node.fs.promises.writeFile(
					this.p.node.path.join(extensionsPath, 'package.json'),
					JSON.stringify(this.beakExtensions.createPackageJsonContent(projectFile.name), null, '\t'),
					'utf8',
				),
				await this.p.node.fs.promises.writeFile(
					this.p.node.path.join(extensionsPath, 'README.md'),
					this.beakExtensions.createReadmeContent(projectFile.name),
					'utf8',
				),
			]);
		}

		await this.changeProjectFileVersion(projectFile, projectFolderPath, '0.3.0');
	}

	/**
	 * Handles the migration of a project from version 0.3.0 to 0.4.0.
	 *
	 * This migration performs the following tasks:
	 *
	 * 1. Updates hidden files, replacing references to variable groups with variable sets.
	 *
	 * 2. Renames folders, changing 'realtime-values' to 'variables' and 'variable-groups' to 'variable-sets'.
	 *
	 * 3. Edits variable group files, replacing references to 'groups' with 'sets'.
	 *
	 * 4. Edits request files, replacing references to variable groups with variable sets.
	 *
	 * 5. Updates the project file version to '0.4.0'.
	 *
	 * @param projectFile - The project file to be migrated.
	 * @param projectFolderPath - The path to the project folder.
	 * @returns A promise that resolves when the migration is complete.
	 */
	private async handle_0_3_0_to_0_4_0(projectFile: ProjectFile, projectFolderPath: string): Promise<void> {
		// Edit hidden files
		await this.replaceStringInBeakFile(projectFolderPath, '.beak/editor.json', 'selectedVariableGroups', 'selectedVariableSets');
		await this.replaceStringInBeakFile(projectFolderPath, '.beak/tab-state.json', '{"type":"variable_group_editor"', '"type":"variable_set_editor"');
		await this.replaceStringInBeakFile(projectFolderPath, '.beak/sidebar.json', 'beak.project.variable-groups', 'beak.project.variable-sets');

		// Rename folders
		if (await fileExists(this, this.p.node.path.join(projectFolderPath, '.beak', 'realtime-values'))) {
			await this.p.node.fs.promises.rename(
				this.p.node.path.join(projectFolderPath, '.beak', 'realtime-values'),
				this.p.node.path.join(projectFolderPath, '.beak', 'variables'),
			);
		}

		if (await fileExists(this, this.p.node.path.join(projectFolderPath, 'variable-groups'))) {
			await this.p.node.fs.promises.rename(
				this.p.node.path.join(projectFolderPath, 'variable-groups'),
				this.p.node.path.join(projectFolderPath, 'variable-sets'),
			);
		}

		// Edit variable group files
		const variableSetFilePaths = await this.p.node.fs.promises.readdir(
			this.p.node.path.join(projectFolderPath, 'variable-sets'),
			{ withFileTypes: true },
		);

		await Promise.all(variableSetFilePaths.map(async file => {
			if (!file.isFile() || !file.name.endsWith('.json'))
				return;

			await this.replaceStringInFile(
				this.p.node.path.join(file.parentPath, file.name),
				'"groups"', '"sets"',
			);
		}));

		// Edit requests
		const requestFilePaths = await this.p.node.fs.promises.readdir(
			this.p.node.path.join(projectFolderPath, 'tree'),
			{ withFileTypes: true, recursive: true },
		);

		await Promise.all(requestFilePaths.map(async file => {
			if (!file.isFile() || !file.name.endsWith('.json'))
				return;

			await this.replaceStringInFile(
				this.p.node.path.join(file.parentPath, file.name),
				'"type": "variable_group_item"',
				'"type": "variable_set_item"',
			);
		}));

		await this.changeProjectFileVersion(projectFile, projectFolderPath, '0.4.0');
	}

	private async replaceStringInBeakFile(
		projectFolderPath: string,
		filePath: string,
		search: string,
		replace: string,
	) {
		const fullFilePath = this.p.node.path.join(projectFolderPath, filePath);

		if (!await fileExists(this, fullFilePath))
			return;

		await this.replaceStringInFile(fullFilePath, search, replace);
	}

	private async replaceStringInFile(filePath: string, search: string, replace: string) {
		if (!await fileExists(this, filePath))
			return;

		const fileContent = await this.p.node.fs.promises.readFile(filePath, 'utf8');
		const updatedFile = fileContent.replace(new RegExp(search, 'g'), replace);

		await this.p.node.fs.promises.writeFile(filePath, updatedFile, 'utf8');
	}

	private async changeProjectFileVersion(
		projectFile: ProjectFile,
		projectFolderPath: string,
		newVersion: string,
	) {
		const newProjectFile: ProjectFile = {
			...projectFile,
			version: newVersion,
		};

		await this.p.node.fs.promises.writeFile(
			this.p.node.path.join(projectFolderPath, 'project.json'),
			JSON.stringify(newProjectFile, null, '\t'),
			{ encoding: 'utf8' },
		);

		// eslint-disable-next-line no-param-reassign
		projectFile = newProjectFile;
	}
}
