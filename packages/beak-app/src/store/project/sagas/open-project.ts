import { call } from 'redux-saga/effects';
import { PayloadAction } from 'typesafe-actions';

import openProject from '../../../lib/project/open';

export default function* workerOpenProject({ payload }: PayloadAction<string, { projectPath: string }>) {
	const { projectPath } = payload;

	const project = yield call(openProject, projectPath);
}
