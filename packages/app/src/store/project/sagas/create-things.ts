import { changeTab } from '@beak/app/features/tabs/store/actions';
import { createFolderNode } from '@beak/app/lib/beak-project/folder';
import { createRequestNode } from '@beak/app/lib/beak-project/request';
import { Nodes } from '@beak/common/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import path from 'path-browserify';
import { call, delay, put, race, select, take } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import actions from '../actions';
import { ActionTypes, CreateNewThing } from '../types';

export function* workerCreateNewFolder({ payload }: PayloadAction<CreateNewThing>) {
	// @ts-expect-error
	const parentNode: Nodes = yield select((s: ApplicationState) => s.global.project.tree[payload.highlightedNodeId]);
	let directory = 'tree/';

	if (parentNode)
		directory = parentNode.type === 'folder' ? parentNode.filePath : path.dirname(parentNode.filePath);

	yield call(createFolderNode, directory, payload.name);
}

export function* workerCreateNewRequest({ payload }: PayloadAction<CreateNewThing>) {
	// @ts-expect-error
	const parentNode: Nodes = yield select((s: ApplicationState) => s.global.project.tree[payload.highlightedNodeId]);
	let directory = 'tree/';

	if (parentNode)
		directory = parentNode.type === 'folder' ? parentNode.filePath : path.dirname(parentNode.filePath);

	const nodeId: string = yield call(createRequestNode, directory, payload.name);

	yield race([
		delay(250),
		take(ActionTypes.INSERT_REQUEST_NODE),
	]);
	yield put(changeTab({ type: 'request', payload: nodeId, temporary: true }));
}
