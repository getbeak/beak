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
		'0.2.0': this.handle_0_2_0_to_0_2_1, // Migrate from 0.2.0 -> 0.2.1
		'0.2.1': this.handle_0_2_1_to_0_3_0, // Migrate from 0.2.1 -> 0.3.0
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

	private async handle_0_2_1_to_0_3_0(projectFile: ProjectFile, projectFolderPath: string): Promise<void> {
		const extensionsPath = this.p.node.path.join(projectFolderPath, 'extensions');

		let hasExtensions = true;

		if (!await fileExists(this, extensionsPath))
			hasExtensions = true;

		// Only try and migrate if extensions don't exist... May be left over from beta testers
		// eslint-disable-next-line no-sync
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
			projectFolderPath,
			JSON.stringify(newProjectFile, null, '\t'),
			{ encoding: 'utf8' },
		);

		// eslint-disable-next-line no-param-reassign
		projectFile = newProjectFile;
	}
}
