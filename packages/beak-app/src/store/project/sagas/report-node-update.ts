import { call, select } from 'redux-saga/effects';
import { PayloadAction } from 'typesafe-actions';

import { ApplicationState } from '../..';
import { getProjectSingleton } from '../../../lib/project';
import { Nodes } from '../../../lib/project/types';

export default function* reportNodeUpdateWorker({ payload }: PayloadAction<string, string>) {
	const project = getProjectSingleton();
	const node: Nodes = yield select((s: ApplicationState) => s.global.project.tree![payload]);

	if (node.type === 'folder')
		yield call([project, project.writeFolderNode], node);

	if (node.type === 'request')
		yield call([project, project.writeRequestNode], node);
}
