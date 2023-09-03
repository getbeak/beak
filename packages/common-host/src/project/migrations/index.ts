import { BeakBase, Providers } from '@beak/common-host/base';
import { ProjectFile } from '@getbeak/types/project';

import BeakExtensions from '../extensions';
import BeakSilentMigrations from './silent';
import BeakStandardMigrations from './standard';

export default class BeakMigrations extends BeakBase {
	private readonly silentMigrations: BeakSilentMigrations;
	private readonly standardMigrations: BeakStandardMigrations;
	private readonly beakExtensions: BeakExtensions;

	constructor(providers: Providers, beakExtensions: BeakExtensions) {
		super(providers);

		this.beakExtensions = beakExtensions;
		this.silentMigrations = new BeakSilentMigrations(providers);
		this.standardMigrations = new BeakStandardMigrations(providers, this.beakExtensions);
	}

	async runMigrations(projectFile: ProjectFile, projectFolderPath: string) {
		await this.standardMigrations.runMigrations(projectFile, projectFolderPath);
		await this.silentMigrations.runMigrations(projectFile, projectFolderPath);
	}
}
