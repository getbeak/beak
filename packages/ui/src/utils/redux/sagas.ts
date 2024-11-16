import { fork, takeEvery, takeLatest } from '@redux-saga/core/effects';
import { PayloadActionCreator } from '@reduxjs/toolkit';

export function createTakeEverySagaSet<ActionCreator extends PayloadActionCreator>(
	actionCreator: ActionCreator,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	worker: (action: ReturnType<ActionCreator>) => Generator<unknown, unknown, any>,
) {
	return fork(function* watcher() {
		yield takeEvery(actionCreator.type, worker);
	});
}

export function createTakeLatestSagaSet<ActionCreator extends PayloadActionCreator>(
	actionCreator: ActionCreator,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	worker: (action: ReturnType<ActionCreator>) => Generator<unknown, unknown, any>,
) {
	return fork(function* watcher() {
		yield takeLatest(actionCreator.type, worker);
	});
}
