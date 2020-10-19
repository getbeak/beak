import { setProjectSingleton } from '@beak/common/src/beak-project';
import BeakProject from '@beak/common/src/beak-project/project';
import { RequestNode } from '@beak/common/src/beak-project/types';
import { PayloadAction } from '@reduxjs/toolkit';
import { all, call, put } from 'redux-saga/effects';

import * as actions from '../actions';

export default function* workerOpenProject({ payload }: PayloadAction<string>) {
	const projectPath = payload;
	const project = new BeakProject(projectPath);

	setProjectSingleton(project);

	yield call([project, project.loadProject]);
	yield call([project, project.loadTree]);

	const pf = project.getProject()!;
	const pp = project.getProjectPath();
	const tree = project.getTree();

	yield put(actions.projectOpened({
		name: pf.name,
		projectPath: pp,
		tree,
	}));

	// TODO(afr): Change this to read previously selected request based on history in hub
	const firstRequest = Object.values(tree).filter(n => n.type === 'request')[0] as RequestNode;

	yield all([
		put(actions.requestSelected(firstRequest.id)),
		put(actions.startFsListener()),
	]);
}
