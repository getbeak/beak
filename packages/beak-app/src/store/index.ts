import { applyMiddleware, combineReducers, createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import createSagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';

import * as projectStore from './project';
import { State as ProjectState } from './project/types';

export interface ApplicationState {
	global: {
		project: ProjectState;
	};
}

function createRootReducer() {
	return combineReducers<ApplicationState>({
		global: combineReducers({
			project: projectStore.reducers,
		}),
	});
}

function* rootSaga() {
	yield all([]);
}

function createInitialState(): ApplicationState {
	return {
		global: {
			project: projectStore.types.initialState,
		},
	};
}

export function configureStore() {
	const composeEnhancers = composeWithDevTools({});
	const sagaMiddleware = createSagaMiddleware();
	const initialState = createInitialState();

	const store = createStore(
		createRootReducer(),
		initialState,
		composeEnhancers(applyMiddleware(sagaMiddleware)),
	);

	const context = {};

	sagaMiddleware.setContext(context);
	sagaMiddleware.run(rootSaga);

	return store;
}
