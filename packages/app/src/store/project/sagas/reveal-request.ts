import { changeTab } from '@beak/app/features/tabs/store/actions';
import { Tree } from '@beak/common/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { delay, put, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';

export default function* workerRevealRequest({ payload }: PayloadAction<string>) {
	for (let i = 0; i < 20; i++) {
		const loaded: boolean = yield select((s: ApplicationState) => s.global.project.loaded);

		// Try for awhile, then give up
		if (!loaded) {
			yield delay(200);
			continue;
		}

		const tree: Tree = yield select((s: ApplicationState) => s.global.project.tree);
		const keys = Object.keys(tree);

		if (keys.includes(payload))
			yield put(changeTab({ type: 'request', payload, temporary: false }));

		return;
	}
}
