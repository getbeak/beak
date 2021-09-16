import { applyMiddleware, combineReducers, createStore, Store } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import createSagaMiddleware from 'redux-saga';
import { all, fork } from 'redux-saga/effects';

import * as omniBarStore from '../features/omni-bar/store';
import { State as OmniBarState } from '../features/omni-bar/store/types';
import * as arbiterStore from './arbiter';
import { State as ArbiterState } from './arbiter/types';
import * as flightStore from './flight';
import { State as FlightState } from './flight/types';
import * as preferencesStore from './preferences';
import { State as PreferencesState } from './preferences/types';
import * as projectStore from './project';
import { State as ProjectState } from './project/types';
import * as variableGroupsStore from './variable-groups';
import { State as VariableGroupState } from './variable-groups/types';

export interface ApplicationState {
	features: {
		omniBar: OmniBarState;
	};
	global: {
		arbiter: ArbiterState;
		flight: FlightState;
		preferences: PreferencesState;
		project: ProjectState;
		variableGroups: VariableGroupState;
	};
}

function createRootReducer() {
	return combineReducers<ApplicationState>({
		features: combineReducers({
			omniBar: omniBarStore.reducer,
		}),
		global: combineReducers({
			arbiter: arbiterStore.reducers,
			flight: flightStore.reducers,
			preferences: preferencesStore.reducers,
			project: projectStore.reducers,
			variableGroups: variableGroupsStore.reducers,
		}),
	});
}

function* rootSaga() {
	yield all([
		fork(arbiterStore.sagas),
		fork(flightStore.sagas),
		fork(preferencesStore.sagas),
		fork(projectStore.sagas),
		fork(variableGroupsStore.sagas),
	]);
}

function createInitialState(): ApplicationState {
	return {
		features: {
			omniBar: omniBarStore.types.initialState,
		},
		global: {
			arbiter: arbiterStore.types.initialState,
			flight: flightStore.types.initialState,
			preferences: preferencesStore.types.initialState,
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
	store.dispatch(arbiterStore.actions.startArbiter());

	return store;
}
