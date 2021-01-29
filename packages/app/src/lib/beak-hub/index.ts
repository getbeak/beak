import { RequestPreference } from '@beak/common/dist/types/beak-hub';
import { validate } from 'jsonschema';

import { requestPreference } from './schemas';

const fs = window.require('electron').remote.require('fs-extra');
const path = window.require('electron').remote.require('path');

export default class BeakHub {
	private _projectPath: string;
	private _hubPath: string;

	constructor(projectPath: string) {
		this._projectPath = projectPath;
		this._hubPath = path.join(projectPath, '.beak');
	}

	async getRequestPreferences(requestId: string): Promise<RequestPreference> {
		const preferencesPath = path.join(this._hubPath, 'preferences', 'request-pane', `${requestId}.json`);

		if (!await fs.pathExists(preferencesPath)) {
			return {
				mainTab: 'headers',
				bodySubTab: 'json',
			};
		}

		const preferenceFile = await fs.readJson(preferencesPath);

		validate(preferenceFile, requestPreference, { throwError: true });

		return preferenceFile;
	}

	async setRequestPreferences(requestId: string, delta: Partial<RequestPreference>) {
		const preferencesPath = path.join(this._hubPath, 'preferences', 'request-pane', `${requestId}.json`);
		const preferences = await this.getRequestPreferences(requestId);

		await fs.ensureFile(preferencesPath);
		await fs.writeJson(preferencesPath, {
			...preferences,
			...delta,
		}, { spaces: '\t' });
	}
}
