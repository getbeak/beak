import { all, fork, takeEvery } from 'redux-saga/effects';

import { ActionTypes } from '../types';
import attemptReconciliation from './attempt-reconciliation';
import catchChanges from './catch-changes';
import loadTabState from './load-tab-state';

const tabChangeActions = [
	ActionTypes.CHANGE_TAB,
	ActionTypes.CHANGE_TAB_NEXT,
	ActionTypes.CHANGE_TAB_PREVIOUS,
	ActionTypes.CLOSE_TAB,
	ActionTypes.CLOSE_TABS_ALL,
	ActionTypes.CLOSE_TABS_LEFT,
	ActionTypes.CLOSE_TABS_OTHER,
	ActionTypes.CLOSE_TABS_RIGHT,
	ActionTypes.MAKE_TAB_PERMANENT,
];

export default function* projectSaga() {
	yield all([
		attemptReconciliation,
		loadTabState,
		fork(function* catchLoadPreferencesWatcher() {
			yield takeEvery(tabChangeActions, catchChanges);
		}),
	]);
}
