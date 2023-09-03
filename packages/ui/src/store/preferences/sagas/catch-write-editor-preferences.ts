import { EditorPreferences } from '@beak/common/types/beak-hub';
import { ipcFsService } from '@beak/ui/lib/ipc';
import path from 'path-browserify';
import { call, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';

export default function* catchWriteEditorPreferences() {
	const preferences: EditorPreferences = yield select((s: ApplicationState) => s.global.preferences.editor);

	if (!preferences)
		return;

	yield call(writeRequestPreferences, preferences);
}

async function writeRequestPreferences(preferences: EditorPreferences) {
	const preferencesPath = path.join('.beak', 'preferences', 'editor.json');

	await ipcFsService.writeJson(preferencesPath, preferences);
}
