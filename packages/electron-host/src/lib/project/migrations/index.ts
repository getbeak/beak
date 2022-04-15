import { TypedObject } from '@beak/common/helpers/typescript';
import { ProjectFile } from '@beak/common/types/beak-project';

import logger from '../../logger';
import handle_0_2_0_to_0_2_1 from './migration-0.2.0-0.2.1';

type MigrationHandler = (projectFolderPath: string) => Promise<void>;

const migrationHistory: Record<string, MigrationHandler> = {
	'0.2.0': handle_0_2_0_to_0_2_1, // Migrate from 0.2.0 -> 0.2.1
};

export async function checkAndHandleMigrations(projectFile: ProjectFile, projectFolderPath: string) {
	const migrations = TypedObject.keys(migrationHistory);
	const migrationIndex = migrations.indexOf(projectFile.version);

	// Check if we even need to do a migration
	if (migrationIndex === -1)
		return;

	for (let i = migrationIndex; i < migrations.length; i++) {
		const migrationKey = migrations[i];
		const migration = migrationHistory[migrationKey];

		if (!migration) {
			logger.error('migration: migration handler not found!', { i, migrationKey });

			break;
		}

		// eslint-disable-next-line no-await-in-loop
		await migration(projectFolderPath);
	}
}
