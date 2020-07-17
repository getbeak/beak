import { call } from 'redux-saga/effects';
import { PayloadAction } from 'typesafe-actions';

import BeakProject from '../../../lib/project/project';

export default function* workerOpenProject({ payload }: PayloadAction<string, { projectPath: string }>) {
	const { projectPath } = payload;
	const project = new BeakProject(projectPath);

	yield call([project, project.loadProject]);
	yield call([project, project.loadTree]);
	yield call([project, project.printTree]);
	yield call([project, project.startWatching]);
}
