import fs from 'fs-extra';
import { validate } from 'jsonschema';
import path from 'path';
import process from 'process';

import { requestPreferenceSchema } from './schemas';
import { RequestPreference } from './types';

export async function setRequestPreference(requestId: string, pref: RequestPreference) {
	const wd = process.cwd();
	const prefFolder = path.join(wd, '.beak', 'request-preferences');
	const prefPath = path.join(wd, '.beak', 'request-preferences', `${requestId}.json`);

	await fs.ensureDir(prefFolder);
	await fs.writeJson(prefPath, pref, { spaces: '\t' });
}

export async function getRequestPreference(requestId: string): Promise<RequestPreference> {
	const wd = process.cwd();
	const prefPath = path.join(wd, '.beak', 'request-preferences', `${requestId}.json`);
	const prefExists = await fs.pathExists(prefPath);

	if (!prefExists) {
		return {
			mainTab: '',
			subTab: null,
		};
	}

	const preference = await fs.readJson(prefPath) as RequestPreference;

	validate(preference, requestPreferenceSchema, { throwError: true });

	return preference;
}
