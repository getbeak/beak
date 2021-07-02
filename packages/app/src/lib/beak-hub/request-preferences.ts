import { RequestPreference, RequestPreferenceMainTab } from '@beak/common/dist/types/beak-hub';
import path from 'path-browserify';

import { readJsonAndValidate } from '../fs';
import { ipcFsService } from '../ipc';
import BeakHub from '.';
import { requestPreference } from './schemas';

export default class BeakRequestPreferences {
	private requestPreferencePath: string;
	private preferences!: RequestPreference;

	constructor(hub: BeakHub, requestId: string) {
		this.requestPreferencePath = path.join(hub.getHubPath(), 'preferences', 'requests', `${requestId}.json`);
	}

	private defaultPreferences(): RequestPreference {
		return { mainTab: 'headers' };
	}

	async load() {
		if (!await ipcFsService.pathExists(this.requestPreferencePath)) {
			this.preferences = this.defaultPreferences();

			return;
		}

		try {
			const preferenceFile = await readJsonAndValidate<RequestPreference>(
				this.requestPreferencePath,
				requestPreference,
			);

			this.preferences = preferenceFile.file;
		} catch (error) {
			if (error.code !== 'schema_invalid')
				throw error;

			this.preferences = this.defaultPreferences();
		}
	}

	async write() {
		await ipcFsService.ensureFile(this.requestPreferencePath);
		await ipcFsService.writeJson(this.requestPreferencePath, this.preferences, { spaces: '\t' });
	}

	getPreferences() {
		return this.preferences;
	}

	async setJsonEditorExpand(jPath: string, expanded: boolean) {
		this.preferences = {
			...this.preferences,
			jsonEditor: {
				...this.preferences?.jsonEditor,
				expands: {
					...this.preferences?.jsonEditor?.expands,
					[jPath]: expanded,
				},
			},
		};

		await this.write();
	}

	async setMainTab(tab: RequestPreferenceMainTab) {
		this.preferences = {
			...this.preferences,
			mainTab: tab,
		};

		await this.write();
	}
}
