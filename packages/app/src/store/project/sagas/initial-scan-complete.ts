import { readFolderNode } from '@beak/app/lib/beak-project/folder';
import { readRequestNode } from '@beak/app/lib/beak-project/request';
import { TypedObject } from '@beak/common/helpers/typescript';
import { FolderNode, RequestNode, Tree } from '@beak/common/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { all, call, put } from 'redux-saga/effects';

import actions from '../actions';
import { InitialScanCompletePayload, ScanEntryPayload } from '../types';

export default function* workerInitialScanComplete({ payload }: PayloadAction<InitialScanCompletePayload>) {
	const folders = payload.entries.filter(s => s.isDirectory);
	const requests = payload.entries.filter(s => !s.isDirectory);

	const folderNodes: Record<string, FolderNode> = yield call(readFolderNodes, folders);
	const requestNodes: Record<string, RequestNode> = yield call(readRequestNodes, requests);
	const firstRequest = TypedObject.values(requestNodes)[0];
	const tree: Tree = {
		...folderNodes,
		...requestNodes,
	};

	yield all([
		// TODO(afr): Change this to read the previously selected request based on history
		// in the hub. Also on first load, I think showing the readme of the project as an
		// onboarding document could be very cool!
		put(actions.requestSelected(firstRequest?.id)),
		put(actions.projectOpened({ tree })),
	]);
}

async function readFolderNodes(folders: ScanEntryPayload[]) {
	if (folders.length === 0)
		return null;

	const results = await Promise.all(folders.map(f => readFolderNode(f.filePath)));

	return results.reduce((acc, val) => ({
		...acc,
		[val.id]: val,
	}), {}) as Record<string, FolderNode>;
}

async function readRequestNodes(requests: ScanEntryPayload[]) {
	if (requests.length === 0)
		return null;

	const results = await Promise.all(requests.map(f => readRequestNode(f.filePath)));

	return results.reduce((acc, val) => ({
		...acc,
		[val.id]: val,
	}), {}) as Record<string, RequestNode>;
}
