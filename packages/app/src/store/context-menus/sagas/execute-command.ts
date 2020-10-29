import { getProjectSingleton } from '@beak/app/lib/beak-project/instance';
import { Nodes } from '@beak/common/dist/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, put, select, take } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import { actions } from '../../project';
import { ActionTypes as ProjectActionTypes } from '../../project/types';
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

			yield take(ProjectActionTypes.INSERT_REQUEST_NODE);
			yield put(actions.requestSelected(id));

			return;
		}

		case 'delete_request': {
			const filePath: string = yield getFilePathFromId(payload.payload);
			const proj = getProjectSingleton();

			// TODO(afr): Add a confirmation here?

			yield call([proj, proj.removeRequestNode], filePath);

			return;
		}

		case 'create_new_folder': {
			const proj = getProjectSingleton();

			yield call([proj, proj.createFolderNode], payload.payload);
			yield take(ProjectActionTypes.INSERT_FOLDER_NODE);

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
