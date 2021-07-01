import { RequestPreference, RequestPreferenceMainTab } from '@beak/common/dist/types/beak-hub';
import path from 'path-browserify';

import { readJsonAndValidate } from '../fs';
import BeakHub from '.';
import { requestPreference } from './schemas';

const remote = window.require('@electron/remote');
const fs = remote.require('fs-extra');

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
		if (!await fs.pathExists(this.requestPreferencePath)) {
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
		await fs.ensureFile(this.requestPreferencePath);
		await fs.writeJson(this.requestPreferencePath, this.preferences, { spaces: '\t' });
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
