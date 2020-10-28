import BeakProject from '@beak/app/lib/beak-project';
import { setProjectSingleton } from '@beak/app/lib/beak-project/instance';
import { RequestNode } from '@beak/common/types/beak-project';
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
	// Also on first load, I think showing the readme of the project as an onboarding
	// document could be very cool
	const firstRequest = Object.values(tree).filter(n => n.type === 'request')[0] as RequestNode;

	yield all([
		put(actions.requestSelected(firstRequest.id)),
		put(actions.startFsListener()),
	]);
}
