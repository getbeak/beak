import { changeTab } from '@beak/ui/features/tabs/store/actions';
import { createFolderNode } from '@beak/ui/lib/beak-project/folder';
import { createRequestNode } from '@beak/ui/lib/beak-project/request';
import type { Nodes } from '@getbeak/types/nodes';
import { PayloadAction } from '@reduxjs/toolkit';
import path from 'path-browserify';
import { call, delay, put, race, select, take } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import { renameStarted } from '../actions';
import { ActionTypes, CreateNewThing } from '../types';

export function* workerCreateNewFolder({ payload }: PayloadAction<CreateNewThing>) {
	// @ts-expect-error
	const parentNode: Nodes = yield select((s: ApplicationState) => s.global.project.tree[payload.highlightedNodeId]);
	let directory = 'tree/';

	if (parentNode)
		directory = parentNode.type === 'folder' ? parentNode.filePath : path.dirname(parentNode.filePath);

	const resolvedPath: string = yield call(createFolderNode, directory, payload.name);

	yield race([
		delay(250),
		take(ActionTypes.INSERT_FOLDER_NODE),
	]);
	yield put(renameStarted({ requestId: resolvedPath }));
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
	yield put(renameStarted({ requestId: nodeId }));
}
