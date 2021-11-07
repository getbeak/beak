import { all } from 'redux-saga/effects';

import loadTabState from './load-tab-state';

export default function* projectSaga() {
	yield all([
		loadTabState,
	]);
}
