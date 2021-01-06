import { fork, takeEvery, takeLatest } from 'redux-saga/effects';

import { TypedActionCreator } from './action-types';

export function createTakeEverySagaSet<ActionCreator extends TypedActionCreator>(
	actionCreator: ActionCreator,
	worker: (action: ReturnType<ActionCreator>) => Generator<unknown, unknown, any>,
) {
	return fork(function* watcher() {
		yield takeEvery(actionCreator.type, worker);
	});
}

export function createTakeLatestSagaSet<ActionCreator extends TypedActionCreator>(
	actionCreator: ActionCreator,
	worker: (action: ReturnType<ActionCreator>) => Generator<unknown, unknown, any>,
) {
	return fork(function* watcher() {
		yield takeLatest(actionCreator.type, worker);
	});
}
