import { RequestPreference, RequestPreferenceMainTab } from '@beak/common/dist/types/beak-hub';
import { validate } from 'jsonschema';

import BeakHub from '.';
import { requestPreference } from './schemas';

const fs = window.require('electron').remote.require('fs-extra');
const path = window.require('electron').remote.require('path');

export default class BeakRequestPreferences {
	private requestPreferencePath: string;
	private preferences!: RequestPreference;

	constructor(hub: BeakHub, requestId: string) {
		this.requestPreferencePath = path.join(hub.getHubPath(), 'preferences', 'requests', `${requestId}.json`);
	}

	async load() {
		if (!await fs.pathExists(this.requestPreferencePath)) {
			this.preferences = { mainTab: 'headers' };

			return;
		}

		const preferenceFile = await fs.readJson(this.requestPreferencePath);

		validate(preferenceFile, requestPreference, { throwError: true });

		this.preferences = preferenceFile;
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
