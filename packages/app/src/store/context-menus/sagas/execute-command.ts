import { getProjectSingleton } from '@beak/app/lib/beak-project/instance';
import { Nodes } from '@beak/common/dist/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, delay, put, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import { actions } from '../../project';
import { Commands } from '../types';

const electron = window.require('electron');
const { ipcRenderer } = electron;

export default function* executeCommandWorker({ payload }: PayloadAction<Commands>) {
	switch (payload.type) {
		case 'reveal_in_finder': {
			const filePath: string = yield getFilePathFromId(payload.payload);

			ipcRenderer.send('misc:open_path_in_finder', filePath);

			return;
		}

		case 'create_new_request': {
			const proj = getProjectSingleton();
			const id: string = yield call([proj, proj.createRequestNode], payload.payload);

			// TODO(afr): hack to make sure app knows about file creation
			yield delay(100);
			yield put(actions.requestSelected(id));

			return;
		}

		default:
			return;
	}
}

function* getFilePathFromId(id: string) {
	if (id === 'root')
		return getProjectSingleton().getProjectPath();

	const node: Nodes = yield select((s: ApplicationState) => s.global.project.tree![id]);

	return node.filePath;
}
