import { getProjectSingleton } from '@beak/common/src/beak-project';
import { Nodes } from '@beak/common/src/beak-project/types';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';

export default function* reportNodeUpdateWorker({ payload }: PayloadAction<string>) {
	const project = getProjectSingleton();
	const node: Nodes = yield select((s: ApplicationState) => s.global.project.tree![payload]);

	if (node.type === 'folder')
		yield call([project, project.writeFolderNode], node);

	if (node.type === 'request')
		yield call([project, project.writeRequestNode], node);
}
