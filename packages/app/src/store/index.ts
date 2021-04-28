// @ts-ignore
import { composeWithDevTools } from 'electron-redux-devtools';
import { applyMiddleware, combineReducers, createStore, Store } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { all, fork } from 'redux-saga/effects';

import * as flightStore from './flight';
import { State as FlightState } from './flight/types';
import * as guardianStore from './guardian';
import * as projectStore from './project';
import { State as ProjectState } from './project/types';
import * as variableGroupsStore from './variable-groups';
import { State as VariableGroupState } from './variable-groups/types';

export interface ApplicationState {
	global: {
		flight: FlightState;
		project: ProjectState;
		variableGroups: VariableGroupState;
	};
}

function createRootReducer() {
	return combineReducers<ApplicationState>({
		global: combineReducers({
			flight: flightStore.reducers,
			project: projectStore.reducers,
			variableGroups: variableGroupsStore.reducers,
		}),
	});
}

function* rootSaga() {
	yield all([
		fork(flightStore.sagas),
		fork(guardianStore.sagas),
		fork(projectStore.sagas),
		fork(variableGroupsStore.sagas),
	]);
}

function createInitialState(): ApplicationState {
	return {
		global: {
			flight: flightStore.types.initialState,
			project: projectStore.types.initialState,
			variableGroups: variableGroupsStore.types.initialState,
		},
	};
}

export function configureStore(): Store<ApplicationState> {
	const composeEnhancers = composeWithDevTools({});
	const sagaMiddleware = createSagaMiddleware();
	const initialState = createInitialState();

	const store = createStore(
		createRootReducer(),
		initialState,
		composeEnhancers(applyMiddleware(sagaMiddleware)),
	);

	sagaMiddleware.run(rootSaga);

	return store;
}
